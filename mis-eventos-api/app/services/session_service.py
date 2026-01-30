from datetime import datetime, timedelta, timezone
from uuid import UUID
from typing import List

from fastapi import HTTPException, status

from app.repositories.session_repository import SessionRepository
from app.repositories.event_repository import EventRepository
from app.repositories.user_repository import UserRepository
from app.schemas.session import SessionCreate, SessionUpdate
from app.models.session import Session
from app.utils.enums import UserRole

class SessionService:
    def __init__(self, session_repo: SessionRepository, event_repo: EventRepository, user_repo: UserRepository):
        self.session_repo = session_repo
        self.event_repo = event_repo
        self.user_repo = user_repo

    async def create_session(self, event_id: UUID, session_data: SessionCreate) -> Session:
        # 1. Validar Evento
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
        
        # 2. Validar Fechas en rango del evento
        # Normalizar zonas horarias para comparación (asegurar UTC)
        def to_utc(dt: datetime) -> datetime:
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)

        s_start = to_utc(session_data.start_time)
        s_end = to_utc(session_data.end_time)
        e_start = to_utc(event.start_date)
        e_end = to_utc(event.end_date)

        if s_start < e_start or s_end > e_end:
            raise HTTPException(status_code=400, detail="Las fechas de la sesión deben estar dentro de las fechas del evento")
            
        # 3. Validar Aforo
        if session_data.capacity > event.max_capacity:
            raise HTTPException(status_code=400, detail="La capacidad de la sesión no puede exceder el aforo máximo del evento")

        # 4. Duración mínima 15 min
        duration = session_data.end_time - session_data.start_time
        if duration.total_seconds() < 15 * 60:
             raise HTTPException(status_code=400, detail="La duración de la sesión debe ser de al menos 15 minutos")

        return await self.session_repo.create(session_data, event_id)

    async def get_session(self, session_id: UUID) -> Session:
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session

    async def update_session(self, session_id: UUID, update_data: SessionUpdate) -> Session:
        session = await self.get_session(session_id)
        
        # 4. Restricción de Edición
        now = datetime.now(timezone.utc)
        
        s_start_check = session.start_time
        if s_start_check.tzinfo is None:
            s_start_check = s_start_check.replace(tzinfo=timezone.utc)
            
        if s_start_check <= now:
             raise HTTPException(status_code=400, detail="No se puede editar una sesión que ya ha comenzado o finalizado")

        # Validar nuevas fechas si se cambian
        if update_data.start_time or update_data.end_time:
            start = update_data.start_time or session.start_time
            end = update_data.end_time or session.end_time
            
            if start >= end:
                raise HTTPException(status_code=400, detail="La hora de finalización debe ser posterior a la hora de inicio")
                
            duration = end - start
            if duration.total_seconds() < 15 * 60:
                raise HTTPException(status_code=400, detail="La duración de la sesión debe ser de al menos 15 minutos")
                
            # Validar rango evento (necesito cargar evento)
            event = await self.event_repo.get_by_id(session.event_id)
            
            def to_utc(dt: datetime) -> datetime:
                if dt.tzinfo is None:
                    return dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc)
            
            e_start = to_utc(event.start_date)
            e_end = to_utc(event.end_date)
            start = to_utc(start)
            end = to_utc(end)
            
            if start < e_start or end > e_end:
                raise HTTPException(status_code=400, detail="Las fechas de la sesión deben estar dentro de las fechas del evento")
                
        # Validar Aforo si se actualiza
        if update_data.capacity:
             # Si no hemos cargado el evento antes, hacerlo ahora
             event = await self.event_repo.get_by_id(session.event_id)
             if update_data.capacity > event.max_capacity:
                 raise HTTPException(status_code=400, detail="La capacidad de la sesión no puede exceder el aforo máximo del evento")

        return await self.session_repo.update(session, update_data)

    async def delete_session(self, session_id: UUID):
        session = await self.get_session(session_id)
        # Podría restringir borrado si ya pasó
        await self.session_repo.delete(session)

    async def list_sessions(self, event_id: UUID) -> List[Session]:
        return await self.session_repo.get_by_event(event_id)

    async def assign_speakers(self, session_id: UUID, speaker_ids: List[UUID]):
        session = await self.get_session(session_id)
        
        for user_id in speaker_ids:
            user = await self.user_repo.get_by_id(user_id)
            if not user:
                raise HTTPException(status_code=404, detail=f"Usuario {user_id} no encontrado")
            
            # Validar Rol
            if user.role != UserRole.SPEAKER:
                raise HTTPException(status_code=400, detail=f"El usuario {user.email} no es un ponente")
            
            # Validar Perfil
            # El requerimiento dice: "los campos biografía, organización y cargo son obligatorios si el usuario tiene el rol de ponente"
            # Esto debe validarse al asignar.
            if not all([user.biography, user.organization, user.position]):
                raise HTTPException(status_code=400, detail=f"El perfil del ponente {user.email} está incompleto (se requiere biografía, organización y cargo)")

            # Validar Disponibilidad (Buffer 5 min)
            # Buscar sesiones del speaker que solapen con (start - 5min, end + 5min)
            buffer = timedelta(minutes=5)
            check_start = session.start_time - buffer
            check_end = session.end_time + buffer
            
            conflicts = await self.session_repo.get_speaker_sessions_in_range(user_id, check_start, check_end)
            # Filtrar la misma sesión si se está editando (aunque aquí es assign, no update session times)
            conflicts = [s for s in conflicts if s.id != session_id]
            
            if conflicts:
                raise HTTPException(status_code=400, detail=f"El ponente {user.email} tiene un conflicto de horario con la sesión: {conflicts[0].title}")

            await self.session_repo.add_speaker(session_id, user_id)

    async def join_session(self, session_id: UUID, user_id: UUID):
        session = await self.get_session(session_id)
        
        # 1. Validar registro en evento general
        registration = await self.event_repo.get_registration(session.event_id, user_id)
        if not registration or not registration.is_active:
             raise HTTPException(status_code=400, detail="El usuario debe estar registrado en el evento para unirse a las sesiones")

        # 2. Validar Aforo
        current_attendees = await self.session_repo.count_attendees(session_id)
        if current_attendees >= session.capacity:
             # Alerta de ocupación (Simulada)
             # print(f"ALERT: Session {session.title} reached max capacity!")
             raise HTTPException(status_code=400, detail="La sesión está llena")

        # 3. Verificar si ya está unido
        existing = await self.session_repo.get_attendee_link(session_id, user_id)
        if existing:
            return # Ya está unido

        await self.session_repo.add_attendee(session_id, user_id)

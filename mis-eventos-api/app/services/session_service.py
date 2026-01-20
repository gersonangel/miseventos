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
            raise HTTPException(status_code=404, detail="Event not found")
        
        # 2. Validar Fechas en rango del evento
        if session_data.start_time < event.start_date or session_data.end_time > event.end_date:
            raise HTTPException(status_code=400, detail="Session dates must be within event dates")

        # 3. Duración mínima 15 min
        duration = session_data.end_time - session_data.start_time
        if duration.total_seconds() < 15 * 60:
             raise HTTPException(status_code=400, detail="Session duration must be at least 15 minutes")

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
        if session.start_time <= now:
             raise HTTPException(status_code=400, detail="Cannot edit a session that has already started or finished")

        # Validar nuevas fechas si se cambian
        if update_data.start_time or update_data.end_time:
            start = update_data.start_time or session.start_time
            end = update_data.end_time or session.end_time
            
            if start >= end:
                raise HTTPException(status_code=400, detail="End time must be after start time")
                
            duration = end - start
            if duration.total_seconds() < 15 * 60:
                raise HTTPException(status_code=400, detail="Session duration must be at least 15 minutes")
                
            # Validar rango evento (necesito cargar evento)
            event = await self.event_repo.get_by_id(session.event_id)
            if start < event.start_date or end > event.end_date:
                raise HTTPException(status_code=400, detail="Session dates must be within event dates")

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
                raise HTTPException(status_code=404, detail=f"User {user_id} not found")
            
            # Validar Rol
            if user.role != UserRole.SPEAKER:
                raise HTTPException(status_code=400, detail=f"User {user.email} is not a speaker")
            
            # Validar Perfil
            # El requerimiento dice: "los campos biografía, organización y cargo son obligatorios si el usuario tiene el rol de ponente"
            # Esto debe validarse al asignar.
            if not all([user.biography, user.organization, user.position]):
                raise HTTPException(status_code=400, detail=f"Speaker {user.email} profile is incomplete (bio, org, position required)")

            # Validar Disponibilidad (Buffer 5 min)
            # Buscar sesiones del speaker que solapen con (start - 5min, end + 5min)
            buffer = timedelta(minutes=5)
            check_start = session.start_time - buffer
            check_end = session.end_time + buffer
            
            conflicts = await self.session_repo.get_speaker_sessions_in_range(user_id, check_start, check_end)
            # Filtrar la misma sesión si se está editando (aunque aquí es assign, no update session times)
            conflicts = [s for s in conflicts if s.id != session_id]
            
            if conflicts:
                raise HTTPException(status_code=400, detail=f"Speaker {user.email} has a scheduling conflict with session: {conflicts[0].title}")

            await self.session_repo.add_speaker(session_id, user_id)

    async def join_session(self, session_id: UUID, user_id: UUID):
        session = await self.get_session(session_id)
        
        # 1. Validar registro en evento general
        registration = await self.event_repo.get_registration(session.event_id, user_id)
        if not registration or not registration.is_active:
             raise HTTPException(status_code=400, detail="User must be registered in the event to join sessions")

        # 2. Validar Aforo
        current_attendees = await self.session_repo.count_attendees(session_id)
        if current_attendees >= session.capacity:
             # Alerta de ocupación (Simulada)
             # print(f"ALERT: Session {session.title} reached max capacity!")
             raise HTTPException(status_code=400, detail="Session is full")

        # 3. Verificar si ya está unido
        existing = await self.session_repo.get_attendee_link(session_id, user_id)
        if existing:
            return # Ya está unido

        await self.session_repo.add_attendee(session_id, user_id)

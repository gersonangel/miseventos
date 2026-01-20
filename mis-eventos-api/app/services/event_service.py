from datetime import datetime
from typing import List, Optional
from uuid import UUID

from app.models.user import User
from app.repositories.event_repository import EventRepository
from app.schemas.event import EventCreate, EventResponse, EventUpdate
from app.utils.enums import EventStatus, EventType, UserRole
from fastapi import HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession


class EventService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.event_repo = EventRepository(db)

    async def create_event(self, event_data: EventCreate, user: User) -> EventResponse:
        # Solo admin u organizer pueden crear eventos (controlado por dependencia en ruta, pero validamos extra aquí)
        if user.role not in [UserRole.ADMIN, UserRole.ORGANIZER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para crear eventos"
            )
            
        event = await self.event_repo.create(event_data, user.id)
        # Aseguramos que available_spots tenga valor (inicialmente igual a capacidad)
        response = EventResponse.model_validate(event)
        response.available_spots = event.max_capacity
        return response

    async def get_event(self, event_id: UUID, user: Optional[User] = None) -> EventResponse:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Evento no encontrado")

        # Regla: Borrador no visible para usuarios normales
        if event.status == EventStatus.DRAFT:
            is_authorized = user and (
                user.role == UserRole.ADMIN or 
                event.organizer_id == user.id
            )
            if not is_authorized:
                raise HTTPException(status_code=404, detail="Evento no encontrado")

        response = EventResponse.model_validate(event)
        
        # Calcular cupos disponibles
        confirmed_count = await self.event_repo.count_registrations(event.id)
        response.available_spots = event.max_capacity - confirmed_count
        
        return response

    async def list_events(
        self,
        skip: int = 0,
        limit: int = 10,
        status_filter: Optional[EventStatus] = None,
        event_type: Optional[EventType] = None,
        search: Optional[str] = None,
        start_date_from: Optional[datetime] = None,
        start_date_to: Optional[datetime] = None,
        user: Optional[User] = None
    ) -> List[EventResponse]:
        
        # Si no es admin/organizer, forzar filtro a eventos públicos (no borradores)
        # O implementar lógica de visibilidad más compleja
        
        events = await self.event_repo.get_all(
            skip, limit, status_filter, event_type, search, start_date_from, start_date_to
        )
        
        # Filtrar borradores si no es el dueño o admin (si no se filtró en query)
        visible_events = []
        for event in events:
            if event.status == EventStatus.DRAFT:
                if user and (user.role == UserRole.ADMIN or event.organizer_id == user.id):
                    visible_events.append(event)
            else:
                visible_events.append(event)

        # Enriquecer con disponibilidad
        results = []
        for event in visible_events:
            resp = EventResponse.model_validate(event)
            count = await self.event_repo.count_registrations(event.id)
            resp.available_spots = event.max_capacity - count
            results.append(resp)
            
        return results

    async def update_event(
        self, event_id: UUID, event_update: EventUpdate, user: User
    ) -> EventResponse:
        
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Evento no encontrado")

        # Verificar permisos (Admin o Dueño)
        if user.role != UserRole.ADMIN and event.organizer_id != user.id:
            raise HTTPException(status_code=403, detail="No tienes permiso para modificar este evento")

        # Regla: No modificar si Finalizado o Cancelado
        if event.status in [EventStatus.FINISHED, EventStatus.CANCELLED]:
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede modificar un evento en estado {event.status.value}"
            )

        updated_event = await self.event_repo.update(event, event_update)
        return EventResponse.model_validate(updated_event)

    async def register_attendee(self, event_id: UUID, user: User) -> dict:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Evento no encontrado")

        if event.status != EventStatus.PUBLISHED:
            raise HTTPException(status_code=400, detail="El evento no está disponible para registro")

        # Verificar si ya está registrado
        existing = await self.event_repo.get_registration(event_id, user.id)
        if existing:
            raise HTTPException(status_code=400, detail="Ya estás registrado en este evento")

        # Verificar aforo
        count = await self.event_repo.count_registrations(event_id)
        if count >= event.max_capacity:
            raise HTTPException(status_code=400, detail="Evento sin cupos disponibles")

        await self.event_repo.register_user(event_id, user.id)
        return {"message": "Registro exitoso"}

    async def cancel_attendee_registration(self, event_id: UUID, user: User) -> dict:
        registration = await self.event_repo.get_registration(event_id, user.id)
        if not registration:
            raise HTTPException(status_code=404, detail="No tienes un registro activo para este evento")

        await self.event_repo.cancel_registration(registration)
        return {"message": "Registro cancelado exitosamente"}

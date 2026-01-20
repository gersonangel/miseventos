from datetime import datetime
from typing import List, Optional
from uuid import UUID

from app.models.user import User
from app.repositories.event_repository import EventRepository
from app.schemas.event import EventCreate, EventResponse, EventUpdate, EventListResponse
from app.schemas.user import UserResponse
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
        
        if user and user.role == UserRole.ADMIN:
            attendees = await self.event_repo.get_attendees(event.id)
            response.attendees = [UserResponse.model_validate(u) for u in attendees]
        
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
        user: Optional[User] = None,
        available_spots_only: bool = False,
    ) -> EventListResponse:
        
        # Determinar visibilidad
        admin_mode = False
        viewer_id = None
        
        if user:
            if user.role == UserRole.ADMIN:
                admin_mode = True
            viewer_id = user.id
            
        # Calcular total
        total = await self.event_repo.count(
            status=status_filter,
            event_type=event_type,
            search=search,
            start_date_from=start_date_from,
            start_date_to=start_date_to,
            available_spots_only=available_spots_only,
            admin_mode=admin_mode,
            viewer_id=viewer_id
        )

        # Obtener eventos paginados
        events = await self.event_repo.get_all(
            skip=skip,
            limit=limit,
            status=status_filter,
            event_type=event_type,
            search=search,
            start_date_from=start_date_from,
            start_date_to=start_date_to,
            available_spots_only=available_spots_only,
            admin_mode=admin_mode,
            viewer_id=viewer_id
        )
        
        # Enriquecer con disponibilidad
        items = []
        for event in events:
            resp = EventResponse.model_validate(event)
            count = await self.event_repo.count_registrations(event.id)
            resp.available_spots = event.max_capacity - count

            if admin_mode:
                attendees = await self.event_repo.get_attendees(event.id)
                resp.attendees = [UserResponse.model_validate(u) for u in attendees]

            items.append(resp)
            
        # Calcular página actual
        # skip = (page - 1) * size  => page = (skip / size) + 1
        page = (skip // limit) + 1 if limit > 0 else 1
            
        return EventListResponse(
            total=total,
            page=page,
            size=limit,
            items=items
        )

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

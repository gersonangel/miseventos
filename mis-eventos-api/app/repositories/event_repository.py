from datetime import datetime
from typing import List, Optional
from uuid import UUID

from app.models.event import Event
from app.models.user import User
from app.models.registration import EventRegistration
from app.schemas.event import EventCreate, EventUpdate
from app.utils.enums import EventStatus, EventType
from sqlalchemy import func, or_, and_
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession


class EventRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, event_data: EventCreate, organizer_id: UUID) -> Event:
        data = event_data.model_dump()
        # Convertir HttpUrl a str para la base de datos
        if "image_desktop" in data:
            data["image_desktop"] = str(data["image_desktop"])
        if "image_mobile" in data:
            data["image_mobile"] = str(data["image_mobile"])
            
        db_event = Event(
            **data,
            organizer_id=organizer_id,
            status=EventStatus.DRAFT  # Inicialmente borrador
        )
        self.db.add(db_event)
        await self.db.commit()
        await self.db.refresh(db_event)
        return db_event

    async def get_by_id(self, event_id: UUID) -> Optional[Event]:
        return await self.db.get(Event, event_id)

    async def update(self, event: Event, event_update: EventUpdate) -> Event:
        event_data = event_update.model_dump(exclude_unset=True)
        
        # Convertir HttpUrl a str
        if "image_desktop" in event_data:
            event_data["image_desktop"] = str(event_data["image_desktop"])
        if "image_mobile" in event_data:
            event_data["image_mobile"] = str(event_data["image_mobile"])
            
        for key, value in event_data.items():
            setattr(event, key, value)
        
        event.updated_at = datetime.now(event.created_at.tzinfo)
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    def _build_query(
        self,
        status: Optional[EventStatus] = None,
        event_type: Optional[EventType] = None,
        search: Optional[str] = None,
        start_date_from: Optional[datetime] = None,
        start_date_to: Optional[datetime] = None,
        available_spots_only: bool = False,
        admin_mode: bool = False,
        viewer_id: Optional[UUID] = None,
    ):
        statement = select(Event)

        # Filtros de Visibilidad (Seguridad)
        if not admin_mode:
            if viewer_id:
                # Ver publicados O (borradores propios)
                statement = statement.where(
                    or_(
                        Event.status != EventStatus.DRAFT,
                        and_(Event.status == EventStatus.DRAFT, Event.organizer_id == viewer_id)
                    )
                )
            else:
                # Solo ver publicados (no borradores)
                statement = statement.where(Event.status != EventStatus.DRAFT)

        if status:
            statement = statement.where(Event.status == status)
        
        if event_type:
            statement = statement.where(Event.event_type == event_type)
            
        if search:
            # Búsqueda case-insensitive parcial
            statement = statement.where(col(Event.title).ilike(f"%{search}%"))
            
        if start_date_from:
            statement = statement.where(Event.start_date >= start_date_from)
            
        if start_date_to:
            statement = statement.where(Event.start_date <= start_date_to)

        if available_spots_only:
            # Subconsulta para contar registros activos por evento
            registrations_count = (
                select(func.count(EventRegistration.id))
                .where(EventRegistration.event_id == Event.id)
                .where(EventRegistration.is_active == True)
                .correlate(Event)
                .scalar_subquery()
            )
            # Filtrar donde la capacidad máxima sea mayor que los registros
            statement = statement.where(Event.max_capacity > registrations_count)
            
        return statement

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 10,
        status: Optional[EventStatus] = None,
        event_type: Optional[EventType] = None,
        search: Optional[str] = None,
        start_date_from: Optional[datetime] = None,
        start_date_to: Optional[datetime] = None,
        available_spots_only: bool = False,
        admin_mode: bool = False,
        viewer_id: Optional[UUID] = None,
    ) -> List[Event]:
        
        statement = self._build_query(
            status, event_type, search, start_date_from, start_date_to, available_spots_only, admin_mode, viewer_id
        )
        statement = statement.offset(skip).limit(limit).order_by(Event.start_date)
        result = await self.db.exec(statement)
        return list(result.all())

    async def count(
        self,
        status: Optional[EventStatus] = None,
        event_type: Optional[EventType] = None,
        search: Optional[str] = None,
        start_date_from: Optional[datetime] = None,
        start_date_to: Optional[datetime] = None,
        available_spots_only: bool = False,
        admin_mode: bool = False,
        viewer_id: Optional[UUID] = None,
    ) -> int:
        statement = self._build_query(
            status, event_type, search, start_date_from, start_date_to, available_spots_only, admin_mode, viewer_id
        )
        # Usar subquery para contar los resultados filtrados
        count_statement = select(func.count()).select_from(statement.subquery())
        result = await self.db.exec(count_statement)
        return result.one()

    async def count_registrations(self, event_id: UUID) -> int:
        statement = select(func.count()).select_from(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.is_active == True
        )
        result = await self.db.exec(statement)
        return result.one()

    async def get_registration(self, event_id: UUID, user_id: UUID) -> Optional[EventRegistration]:
        statement = select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == user_id,
            EventRegistration.is_active == True
        )
        result = await self.db.exec(statement)
        return result.first()

    async def register_user(self, event_id: UUID, user_id: UUID) -> EventRegistration:
        registration = EventRegistration(event_id=event_id, user_id=user_id)
        self.db.add(registration)
        await self.db.commit()
        await self.db.refresh(registration)
        return registration

    async def cancel_registration(self, registration: EventRegistration):
        registration.is_active = False
        self.db.add(registration)
        await self.db.commit()

    async def get_attendees(self, event_id: UUID) -> List[User]:
        statement = (
            select(User)
            .join(EventRegistration, User.id == EventRegistration.user_id)
            .where(
                EventRegistration.event_id == event_id,
                EventRegistration.is_active == True
            )
        )
        result = await self.db.exec(statement)
        return list(result.all())

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from app.models.event import Event
from app.models.registration import EventRegistration
from app.schemas.event import EventCreate, EventUpdate
from app.utils.enums import EventStatus, EventType
from sqlalchemy import func
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession


class EventRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, event_data: EventCreate, organizer_id: UUID) -> Event:
        db_event = Event(
            **event_data.model_dump(),
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
        for key, value in event_data.items():
            setattr(event, key, value)
        
        event.updated_at = datetime.now(event.created_at.tzinfo)
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 10,
        status: Optional[EventStatus] = None,
        event_type: Optional[EventType] = None,
        search: Optional[str] = None,
        start_date_from: Optional[datetime] = None,
        start_date_to: Optional[datetime] = None,
    ) -> List[Event]:
        
        statement = select(Event)

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

        statement = statement.offset(skip).limit(limit).order_by(Event.start_date)
        result = await self.db.exec(statement)
        return list(result.all())

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

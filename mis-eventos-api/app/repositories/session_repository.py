from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.session import Session, SessionSpeakerLink, SessionAttendeeLink
from app.schemas.session import SessionCreate, SessionUpdate
from app.models.user import User

class SessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, session_data: SessionCreate, event_id: UUID) -> Session:
        db_session = Session(**session_data.model_dump(), event_id=event_id)
        self.db.add(db_session)
        await self.db.commit()
        await self.db.refresh(db_session)
        return db_session

    async def get_by_id(self, session_id: UUID) -> Optional[Session]:
        # Cargar relaciones puede ser útil
        statement = select(Session).where(Session.id == session_id).options(
            selectinload(Session.speakers),
            selectinload(Session.attendees)
        )
        result = await self.db.exec(statement)
        return result.first()

    async def update(self, session: Session, session_update: SessionUpdate) -> Session:
        update_data = session_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(session, key, value)
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def delete(self, session: Session):
        await self.db.delete(session)
        await self.db.commit()

    async def get_by_event(self, event_id: UUID) -> List[Session]:
        statement = select(Session).where(Session.event_id == event_id).order_by(Session.start_time)
        result = await self.db.exec(statement)
        return list(result.all())

    async def get_speaker_sessions_in_range(self, user_id: UUID, start_time: datetime, end_time: datetime) -> List[Session]:
        # Buscar sesiones donde el usuario es speaker y hay solapamiento de horario
        # Solapamiento: (StartA < EndB) and (EndA > StartB)
        statement = (
            select(Session)
            .join(SessionSpeakerLink)
            .where(SessionSpeakerLink.user_id == user_id)
            .where(Session.start_time < end_time)
            .where(Session.end_time > start_time)
        )
        result = await self.db.exec(statement)
        return list(result.all())

    async def add_speaker(self, session_id: UUID, user_id: UUID):
        # Verificar si ya existe para no duplicar
        existing = await self.db.exec(
            select(SessionSpeakerLink).where(
                SessionSpeakerLink.session_id == session_id,
                SessionSpeakerLink.user_id == user_id
            )
        )
        if not existing.first():
            link = SessionSpeakerLink(session_id=session_id, user_id=user_id)
            self.db.add(link)
            await self.db.commit()

    async def remove_speaker(self, session_id: UUID, user_id: UUID):
        statement = select(SessionSpeakerLink).where(
            SessionSpeakerLink.session_id == session_id,
            SessionSpeakerLink.user_id == user_id
        )
        result = await self.db.exec(statement)
        link = result.first()
        if link:
            await self.db.delete(link)
            await self.db.commit()

    async def get_attendee_link(self, session_id: UUID, user_id: UUID) -> Optional[SessionAttendeeLink]:
        statement = select(SessionAttendeeLink).where(
            SessionAttendeeLink.session_id == session_id,
            SessionAttendeeLink.user_id == user_id
        )
        result = await self.db.exec(statement)
        return result.first()

    async def count_attendees(self, session_id: UUID) -> int:
        statement = select(func.count()).select_from(SessionAttendeeLink).where(
            SessionAttendeeLink.session_id == session_id
        )
        result = await self.db.exec(statement)
        return result.one()

    async def add_attendee(self, session_id: UUID, user_id: UUID):
        link = SessionAttendeeLink(session_id=session_id, user_id=user_id)
        self.db.add(link)
        await self.db.commit()

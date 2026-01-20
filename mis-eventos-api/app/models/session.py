from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import DateTime, Text

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.user import User

def utc_now():
    return datetime.now(timezone.utc)

from app.models.links import SessionSpeakerLink, SessionAttendeeLink

class Session(SQLModel, table=True):
    __tablename__ = "sessions"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(max_length=200, nullable=False)
    description: Optional[str] = Field(default=None, sa_type=Text)
    start_time: datetime = Field(sa_type=DateTime(timezone=True), nullable=False)
    end_time: datetime = Field(sa_type=DateTime(timezone=True), nullable=False)
    location: str = Field(max_length=200, nullable=False)
    capacity: int = Field(gt=0, nullable=False)
    
    event_id: UUID = Field(foreign_key="events.id", nullable=False)
    
    # Relaciones
    event: "Event" = Relationship(back_populates="sessions")
    speakers: List["User"] = Relationship(back_populates="speaker_sessions", link_model=SessionSpeakerLink)
    attendees: List["User"] = Relationship(back_populates="attendee_sessions", link_model=SessionAttendeeLink)

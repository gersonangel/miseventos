from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID, uuid4

from app.utils.enums import EventStatus, EventType
from sqlmodel import Field, SQLModel, Relationship


def utc_now():
    return datetime.now(timezone.utc)


class Event(SQLModel, table=True):

    __tablename__ = "events"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(max_length=200, index=True)
    description: str
    
    # Imágenes (URLs o paths locales)
    image_desktop: Optional[str] = Field(default=None)
    image_mobile: Optional[str] = Field(default=None)

    # Fechas
    start_date: datetime = Field(index=True)
    end_date: datetime
    
    location: str
    max_capacity: int = Field(gt=0)
    
    event_type: EventType = Field(default=EventType.OTHER)
    status: EventStatus = Field(default=EventStatus.DRAFT, index=True)
    
    # Auditoría
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    
    # Relación con Organizador
    organizer_id: UUID = Field(foreign_key="users.id")
    organizer: Optional["User"] = Relationship(back_populates="organized_events")

    # Relación con Asistentes (vía tabla intermedia)
    registrations: List["EventRegistration"] = Relationship(back_populates="event")

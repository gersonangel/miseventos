from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID, uuid4

from app.utils.enums import EventStatus, EventType
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import DateTime


def utc_now():
    return datetime.now(timezone.utc)


class Event(SQLModel, table=True):

    __tablename__ = "events"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(max_length=200, index=True)
    description: str
    
    # Imágenes (URLs o paths locales)
    image_desktop: str
    image_mobile: str

    # Fechas
    start_date: datetime = Field(index=True, sa_type=DateTime(timezone=True))
    end_date: datetime = Field(sa_type=DateTime(timezone=True))
    
    location: str
    max_capacity: int = Field(gt=0)
    
    event_type: EventType = Field(default=EventType.OTHER)
    status: EventStatus = Field(default=EventStatus.DRAFT, index=True)
    
    # Auditoría
    created_at: datetime = Field(default_factory=utc_now, sa_type=DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=utc_now, sa_type=DateTime(timezone=True))
    
    # Relación con Organizador
    organizer_id: UUID = Field(foreign_key="users.id")
    organizer: Optional["User"] = Relationship(back_populates="organized_events")

    # Relación con Asistentes (vía tabla intermedia)
    registrations: List["EventRegistration"] = Relationship(back_populates="event")
    
    # Relación con Sesiones
    sessions: List["Session"] = Relationship(back_populates="event")

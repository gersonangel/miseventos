from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel, Relationship


def utc_now():
    return datetime.now(timezone.utc)


class EventRegistration(SQLModel, table=True):
    
    __tablename__ = "event_registrations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    event_id: UUID = Field(foreign_key="events.id", index=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    
    registered_at: datetime = Field(default_factory=utc_now)
    is_active: bool = Field(default=True)  # True = Confirmado, False = Cancelado

    # Relaciones
    event: "Event" = Relationship(back_populates="registrations")
    user: "User" = Relationship(back_populates="registrations")

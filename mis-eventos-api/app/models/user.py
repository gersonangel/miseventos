from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from app.utils.enums import UserRole
from pydantic import EmailStr, ConfigDict
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import DateTime

def utc_now():
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):

    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: EmailStr = Field(unique=True, index=True, nullable=False)
    hashed_password: str = Field(nullable=False)
    full_name: str = Field(max_length=200)
    role: UserRole = Field(default=UserRole.ATTENDEE)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utc_now, sa_type=DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=utc_now, sa_type=DateTime(timezone=True))

    # Relaciones
    organized_events: list["Event"] = Relationship(back_populates="organizer")
    registrations: list["EventRegistration"] = Relationship(back_populates="user")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "usuario@ejemplo.com",
                "full_name": "Juan Pérez",
                "role": "attendee",
                "is_active": True,
            }
        }
    )

from datetime import datetime
from typing import Optional
from uuid import UUID

from app.utils.enums import UserRole
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):

    email: EmailStr
    full_name: str = Field(min_length=1, max_length=200)


class UserCreate(UserBase):
    """Schema para crear Usuario"""

    password: str = Field(min_length=8, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "nuevo@ejemplo.com",
                "full_name": "María López",
                "password": "password123",
            }
        }
    )


class UserCreateAdmin(UserCreate):
    """Schema para crear Usuario por Admin (con rol)"""

    role: UserRole = Field(default=UserRole.ATTENDEE)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "admin@ejemplo.com",
                "full_name": "Admin User",
                "password": "securepassword",
                "role": "admin",
            }
        }
    )


class UserUpdate(BaseModel):
    """Schema para actualizar Usuario (solo admin)"""

    full_name: Optional[str] = Field(None, min_length=1, max_length=200)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    biography: Optional[str] = None
    organization: Optional[str] = Field(None, max_length=200)
    position: Optional[str] = Field(None, max_length=100)
    profile_picture: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "full_name": "María López García",
                "role": "organizer",
                "is_active": True,
                "organization": "Tech Corp",
                "position": "CTO"
            }
        }
    )


class UserResponse(UserBase):

    id: UUID
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
    biography: Optional[str] = None
    organization: Optional[str] = None
    position: Optional[str] = None
    profile_picture: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "usuario@ejemplo.com",
                "full_name": "Juan Pérez",
                "role": "attendee",
                "is_active": True,
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:30:00",
            }
        },
    )


class UserInDB(UserResponse):

    hashed_password: str

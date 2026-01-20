from typing import Optional
from uuid import UUID

from app.schemas.user import UserResponse
from pydantic import BaseModel, EmailStr, ConfigDict


class LoginRequest(BaseModel):

    email: EmailStr
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"email": "usuario@ejemplo.com", "password": "password123"}
        }
    )


class Token(BaseModel):
    """Schema de respuesta de token"""

    access_token: str
    token_type: str = "bearer"

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
            }
        }
    )


class TokenData(BaseModel):
    """Schema de datos del token"""

    user_id: Optional[UUID] = None
    email: Optional[str] = None


class LoginResponse(BaseModel):
    """Schema de respuesta completa de login"""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "usuario@ejemplo.com",
                    "full_name": "Juan Pérez",
                    "role": "attendee",
                    "is_active": True,
                    "created_at": "2024-01-15T10:30:00",
                    "updated_at": "2024-01-15T10:30:00",
                },
            }
        }
    )

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from datetime import timezone

from app.schemas.user import UserResponse

class SessionBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: str = Field(min_length=1, max_length=200)
    capacity: int = Field(gt=0)

    @model_validator(mode="after")
    def check_dates_order(self) -> "SessionBase":
        if self.end_time <= self.start_time:
            raise ValueError("La hora de finalización debe ser posterior a la de inicio")
        return self

class SessionCreate(SessionBase):
    @model_validator(mode="after")
    def validate_future_date(self) -> "SessionCreate":
        # Asegurar UTC para comparación
        now = datetime.now(timezone.utc)
        start = self.start_time
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
            
        if start < now:
            raise ValueError("La fecha de inicio de la sesión debe ser futura")
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Taller de Introducción",
                "description": "Una sesión introductoria",
                "start_time": "2026-01-20T10:00:00Z",
                "end_time": "2026-01-20T11:00:00Z",
                "location": "Sala 1",
                "capacity": 50
            }
        }
    )

class SessionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = Field(None, min_length=1, max_length=200)
    capacity: Optional[int] = Field(None, gt=0)

    @model_validator(mode="after")
    def check_dates_order(self) -> "SessionUpdate":
        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                raise ValueError("La hora de finalización debe ser posterior a la de inicio")
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Taller Avanzado",
                "capacity": 50
            }
        }
    )

class SessionResponse(SessionBase):
    id: UUID
    event_id: UUID
    
    # Opcional: Incluir lista de speakers
    speakers: List[UserResponse] = []

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Keynote Speaker",
                "start_time": "2024-01-15T10:00:00Z",
                "end_time": "2024-01-15T11:00:00Z",
                "location": "Auditorio Principal",
                "capacity": 200,
                "event_id": "event-uuid"
            }
        }
    )

class SpeakerAssign(BaseModel):
    speaker_ids: List[UUID]

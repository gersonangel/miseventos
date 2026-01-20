from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.schemas.user import UserResponse

class SessionBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: str = Field(min_length=1, max_length=200)
    capacity: int = Field(gt=0)

    @field_validator('end_time')
    @classmethod
    def check_dates(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = Field(None, min_length=1, max_length=200)
    capacity: Optional[int] = Field(None, gt=0)

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

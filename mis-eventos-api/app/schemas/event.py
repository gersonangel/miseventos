from datetime import datetime
from typing import Optional
from uuid import UUID

from app.utils.enums import EventStatus, EventType
from pydantic import BaseModel, ConfigDict, Field, model_validator


class EventBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str
    start_date: datetime
    end_date: datetime
    location: str
    max_capacity: int = Field(gt=0)
    event_type: EventType
    image_desktop: Optional[str] = None
    image_mobile: Optional[str] = None


class EventCreate(EventBase):
    
    @model_validator(mode="after")
    def validate_dates(self) -> "EventCreate":
        now = datetime.now(self.start_date.tzinfo)
        
        if self.start_date < now:
            raise ValueError("La fecha de inicio debe ser futura")
        
        if self.end_date <= self.start_date:
            raise ValueError("La fecha de fin debe ser posterior a la de inicio")
            
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Conferencia Tech 2024",
                "description": "Lo mejor de la tecnología",
                "start_date": "2024-12-01T09:00:00Z",
                "end_date": "2024-12-01T18:00:00Z",
                "location": "Auditorio Central",
                "max_capacity": 100,
                "event_type": "conference"
            }
        }
    )


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    max_capacity: Optional[int] = Field(None, gt=0)
    event_type: Optional[EventType] = None
    status: Optional[EventStatus] = None
    image_desktop: Optional[str] = None
    image_mobile: Optional[str] = None

    @model_validator(mode="after")
    def validate_dates(self) -> "EventUpdate":
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValueError("La fecha de fin debe ser posterior a la de inicio")
        return self


class EventResponse(EventBase):
    id: UUID
    status: EventStatus
    organizer_id: UUID
    created_at: datetime
    updated_at: datetime
    
    # Campo calculado para disponibilidad
    # Cambiamos default=0 para que siempre tenga valor
    available_spots: int = Field(default=0)

    model_config = ConfigDict(from_attributes=True)
    
    
class EventResponseWithSpots(EventResponse):
    available_spots: int

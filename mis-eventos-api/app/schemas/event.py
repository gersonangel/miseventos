from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator, HttpUrl

from app.utils.enums import EventStatus, EventType

if TYPE_CHECKING:
    from app.schemas.user import UserResponse


class EventBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, description="Descripción detallada del evento")
    start_date: datetime
    end_date: datetime
    location: str = Field(min_length=3, description="Ubicación del evento")
    max_capacity: int = Field(gt=0)
    event_type: EventType
    image_desktop: HttpUrl = Field(description="URL válida de la imagen para escritorio")
    image_mobile: HttpUrl = Field(description="URL válida de la imagen para móviles")


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
                "title": "Conferencia Tech 2026",
                "description": "Lo mejor de la tecnología en un solo lugar",
                "start_date": "2026-01-20T09:00:00Z",
                "end_date": "2026-01-20T18:00:00Z",
                "location": "Auditorio Central",
                "max_capacity": 100,
                "event_type": "conference",
                "image_desktop": "https://example.com/desktop.jpg",
                "image_mobile": "https://example.com/mobile.jpg"
            }
        }
    )


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = Field(None, min_length=3)
    max_capacity: Optional[int] = Field(None, gt=0)
    event_type: Optional[EventType] = None
    status: Optional[EventStatus] = None
    image_desktop: Optional[HttpUrl] = None
    image_mobile: Optional[HttpUrl] = None

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
    
    # Lista de asistentes (solo visible para admin)
    attendees: List["UserResponse"] = []

    model_config = ConfigDict(from_attributes=True)
    
    
class EventResponseWithSpots(EventResponse):
    available_spots: int


class EventListResponse(BaseModel):
    """Schema para respuesta paginada de eventos"""
    total: int
    page: int
    size: int
    items: List[EventResponse]


# Esto es necesario para resolver la referencia circular en tiempo de ejecución
# Importamos localmente para evitar el ciclo, pero ejecutamos rebuild
from app.schemas.user import UserResponse
EventResponse.model_rebuild()
EventListResponse.model_rebuild()

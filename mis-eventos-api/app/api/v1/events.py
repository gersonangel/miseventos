from datetime import datetime
from typing import Annotated, List, Optional
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_active_user, get_current_user, get_optional_current_user
from app.models.user import User
from app.schemas.event import EventCreate, EventResponse, EventUpdate, EventListResponse
from app.services.event_service import EventService
from app.services.cache_service import cache_service
from app.utils.enums import EventStatus, EventType
from fastapi import APIRouter, Depends, Query, status, UploadFile, File, Request, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
import shutil
import os
from uuid import uuid4

router = APIRouter(prefix="/events", tags=["Eventos"])


@router.post(
    "/upload-image",
    summary="Subir imagen de evento",
    description="Sube una imagen y retorna la URL pública. (Solo Organizadores o Admin)",
)
async def upload_event_image(
    request: Request,
    file: Annotated[UploadFile, File(description="Archivo de imagen (jpg, png, webp)")],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    # Validar extensión
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El archivo debe ser una imagen"
        )
    
    # Crear directorio si no existe (por seguridad)
    os.makedirs("uploads", exist_ok=True)
    
    # Generar nombre único
    filename = f"{uuid4()}_{file.filename}"
    file_path = f"uploads/{filename}"
    
    # Guardar archivo
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar la imagen: {str(e)}"
        )
        
    # Generar URL completa
    # request.base_url retorna ej: http://localhost:8000/
    url = f"{request.base_url}static/{filename}"
    
    return {"url": url}


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear evento",
    description="Crea un nuevo evento (Solo Organizadores o Admin)",
)
async def create_event(
    event_data: EventCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = EventService(db)
    result = await service.create_event(event_data, current_user)
    await cache_service.clear_pattern("events_list:*")
    return result


@router.get(
    "",
    response_model=EventListResponse,
    summary="Listar eventos",
    description="Busca y filtra eventos. Los borradores solo son visibles para sus creadores.",
)
async def list_events(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None, # Usuario opcional para ver pública
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[EventStatus] = None,
    event_type: Optional[EventType] = None,
    search: Optional[str] = None,
    start_date_from: Optional[datetime] = None,
    start_date_to: Optional[datetime] = None,
    available_spots_only: bool = Query(False, description="Mostrar solo eventos con cupos disponibles"),
):
    # Generar clave de caché única basada en los parámetros
    user_id = str(current_user.id) if current_user else "anon"
    cache_key = f"events_list:{page}:{size}:{status}:{event_type}:{search}:{start_date_from}:{start_date_to}:{available_spots_only}:{user_id}"

    # Intentar obtener del caché
    cached_data = await cache_service.get(cache_key)
    if cached_data:
        return EventListResponse.model_validate_json(cached_data)

    service = EventService(db)
    skip = (page - 1) * size
    result = await service.list_events(
        skip=skip,
        limit=size,
        status_filter=status,
        event_type=event_type,
        search=search,
        start_date_from=start_date_from,
        start_date_to=start_date_to,
        user=current_user,
        available_spots_only=available_spots_only,
    )
    
    # Guardar en caché
    await cache_service.set(cache_key, result.model_dump_json())
    
    return result


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    summary="Obtener detalle de evento",
)
async def get_event(
    event_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
):
    # Intentar obtener del caché
    cache_key = f"event_detail:{event_id}"
    cached_data = await cache_service.get(cache_key)
    if cached_data:
        return EventResponse.model_validate_json(cached_data)

    service = EventService(db)
    # Ya retorna un objeto Pydantic con available_spots calculado
    result = await service.get_event(event_id, current_user)
    
    # Guardar en caché
    await cache_service.set(cache_key, result.model_dump_json())
    
    return result


@router.put(
    "/{event_id}",
    response_model=EventResponse,
    summary="Actualizar evento",
    description="Modifica un evento existente (Solo creador o Admin). No permitido si Finalizado/Cancelado.",
)
async def update_event(
    event_id: UUID,
    event_update: EventUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = EventService(db)
    response = await service.update_event(event_id, event_update, current_user)
    
    # Calcular cupos disponibles (ya que update devuelve el objeto actualizado)
    # y necesitamos asegurarnos de que el campo calculado se incluya
    if hasattr(response, "available_spots") and response.available_spots is None:
        count = await service.event_repo.count_registrations(event_id)
        # response es un EventResponse (Pydantic), no un ORM object
        # Pero available_spots está definido en el schema
        response.available_spots = response.max_capacity - count
        
    await cache_service.clear_pattern("events_list:*")
    await cache_service.delete(f"event_detail:{event_id}")
    return response


@router.post(
    "/{event_id}/register",
    summary="Inscribirse a evento",
    description="Registra al usuario actual como asistente al evento.",
)
async def register_to_event(
    event_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = EventService(db)
    result = await service.register_attendee(event_id, current_user)
    await cache_service.clear_pattern("events_list:*")
    return result


@router.delete(
    "/{event_id}/register",
    summary="Cancelar inscripción",
    description="Cancela el registro del usuario actual al evento.",
)
async def cancel_registration(
    event_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = EventService(db)
    result = await service.cancel_attendee_registration(event_id, current_user)
    await cache_service.clear_pattern("events_list:*")
    return result

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.session import SessionCreate, SessionResponse, SessionUpdate, SpeakerAssign
from app.services.session_service import SessionService
from app.repositories.session_repository import SessionRepository
from app.repositories.event_repository import EventRepository
from app.repositories.user_repository import UserRepository
from app.utils.enums import UserRole
from app.services.cache_service import cache_service
import json

router = APIRouter(prefix="/sessions", tags=["Sesiones"])

def get_session_service(db: AsyncSession = Depends(get_db)) -> SessionService:
    return SessionService(
        SessionRepository(db),
        EventRepository(db),
        UserRepository(db)
    )

@router.post("/events/{event_id}/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED,
    summary="Crear sesión",
    description="Crea una nueva sesión asociada a un evento específico. Requiere permisos de administrador u organizador. Valida que la sesión esté dentro de las fechas del evento y respete el aforo y horario.")
async def create_session(
    event_id: UUID,
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.ORGANIZER]:
         raise HTTPException(status_code=403, detail="Not authorized to create sessions")
    # Nota: Idealmente verificar que el organizador sea dueño del evento
    result = await service.create_session(event_id, session_data)
    await cache_service.clear_pattern(f"sessions_list:{event_id}")
    return result

@router.get("/events/{event_id}/sessions", response_model=List[SessionResponse],
    summary="Listar sesiones",
    description="Obtiene todas las sesiones programadas para un evento específico, ordenadas por hora de inicio.")
async def list_sessions(
    event_id: UUID,
    service: SessionService = Depends(get_session_service)
):
    cache_key = f"sessions_list:{event_id}"
    cached_data = await cache_service.get(cache_key)
    if cached_data:
        # Es una lista, deserializamos cada item
        data = json.loads(cached_data)
        return [SessionResponse.model_validate(item) for item in data]

    result = await service.list_sessions(event_id)
    
    # Serializamos la lista de modelos
    serialized = json.dumps([item.model_dump(mode="json") for item in result])
    await cache_service.set(cache_key, serialized)
    
    return result

@router.get("/sessions/{session_id}", response_model=SessionResponse,
    summary="Obtener detalles de sesión",
    description="Recupera la información detallada de una sesión específica por su ID.")
async def get_session(
    session_id: UUID,
    service: SessionService = Depends(get_session_service)
):
    cache_key = f"session_detail:{session_id}"
    cached_data = await cache_service.get(cache_key)
    if cached_data:
        return SessionResponse.model_validate_json(cached_data)

    result = await service.get_session(session_id)
    await cache_service.set(cache_key, result.model_dump_json())
    return result

@router.put("/sessions/{session_id}", response_model=SessionResponse,
    summary="Actualizar sesión",
    description="Modifica los datos de una sesión existente. Requiere permisos de administrador u organizador.")
async def update_session(
    session_id: UUID,
    session_data: SessionUpdate,
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.ORGANIZER]:
         raise HTTPException(status_code=403, detail="No autorizado para actualizar sesiones")
    
    result = await service.update_session(session_id, session_data)
    
    # Invalidar caché de detalle y lista del evento asociado
    await cache_service.delete(f"session_detail:{session_id}")
    await cache_service.clear_pattern(f"sessions_list:{result.event_id}")
    
    return result

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar sesión",
    description="Elimina una sesión del sistema. Requiere permisos de administrador u organizador.")
async def delete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.ORGANIZER]:
         raise HTTPException(status_code=403, detail="Not authorized to delete sessions")
         
    # Necesitamos el ID del evento antes de borrar para invalidar la lista
    # Como delete_session no retorna nada, hacemos un get primero o invalidamos todo sessions_list:*
    # Para ser eficientes, intentamos obtener la sesión primero
    try:
        session = await service.get_session(session_id)
        event_id = session.event_id
    except:
        event_id = None

    await service.delete_session(session_id)
    
    await cache_service.delete(f"session_detail:{session_id}")
    if event_id:
        await cache_service.clear_pattern(f"sessions_list:{event_id}")
    else:
        # Fallback si no pudimos obtener el ID
        await cache_service.clear_pattern("sessions_list:*")

@router.post("/sessions/{session_id}/speakers", status_code=status.HTTP_200_OK,
    summary="Asignar ponentes a sesión",
    description="Asigna una lista de usuarios (ponentes) a una sesión. Verifica que los usuarios tengan el rol de SPEAKER y no tengan conflictos de horario.")
async def assign_speakers(
    session_id: UUID,
    data: SpeakerAssign,
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.ORGANIZER]:
        raise HTTPException(status_code=403, detail="No autorizado para asignar ponentes")
    await service.assign_speakers(session_id, data.speaker_ids)
    
    # Invalidamos caché. Necesitamos event_id, pero assign_speakers no lo devuelve.
    # Obtenemos sesión actualizada o invalidamos listas globales si es muy costoso
    # Vamos a obtener la sesión para invalidar correctamente
    session = await service.get_session(session_id)
    await cache_service.delete(f"session_detail:{session_id}")
    await cache_service.clear_pattern(f"sessions_list:{session.event_id}")
    
    return {"message": "Speakers assigned successfully"}

@router.post("/sessions/{session_id}/join", status_code=status.HTTP_200_OK,
    summary="Inscribirse a sesión",
    description="Permite a un usuario autenticado inscribirse como asistente a una sesión. Verifica disponibilidad de aforo y conflictos de horario.")
async def join_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service)
):
    await service.join_session(session_id, current_user.id)
    return {"message": "Joined session successfully"}

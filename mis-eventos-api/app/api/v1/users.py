from typing import Annotated, Optional
from uuid import UUID

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserCreateAdmin
from app.services.user_service import UserService
from app.services.cache_service import cache_service
from app.utils.enums import UserRole
from fastapi import APIRouter, Depends, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession
import json

router = APIRouter(prefix="/users", tags=["Usuarios"])


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear usuario",
    description="Crea un nuevo usuario con un rol específico (solo admin)",
    dependencies=[Depends(require_admin)],
)
async def create_user(
    user_data: UserCreateAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):

    user_service = UserService(db)
    result = await user_service.create_user(user_data, current_user)
    await cache_service.clear_pattern("users_list:*")
    return result


@router.get(
    "",
    response_model=dict,
    summary="Listar usuarios",
    description="Obtiene lista paginada de usuarios (solo admin)",
    dependencies=[Depends(require_admin)],
)
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100, description="Tamaño de página"),
    role: Optional[UserRole] = Query(None, description="Filtrar por rol"),
):
    cache_key = f"users_list:{page}:{size}:{role}"
    cached_data = await cache_service.get(cache_key)
    if cached_data:
        # get_all_users retorna un dict con "items" y "total"
        return json.loads(cached_data)

    user_service = UserService(db)
    result = await user_service.get_all_users(page=page, size=size, role=role)
    
    # En get_all_users, result es un dict, y result['items'] son objetos UserResponse
    # Necesitamos serializar esto correctamente. 
    # Los objetos Pydantic dentro del dict necesitan ser convertidos.
    serialized_items = [item.model_dump(mode="json") for item in result["items"]]
    to_cache = {
        "items": serialized_items,
        "total": result["total"],
        "page": result["page"],
        "size": result["size"]
    }
    
    await cache_service.set(cache_key, json.dumps(to_cache))
    return result


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Obtener usuario por ID",
    description="Obtiene información de un usuario específico (solo admin)",
    dependencies=[Depends(require_admin)],
)
async def get_user(
    user_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    cache_key = f"user_detail:{user_id}"
    cached_data = await cache_service.get(cache_key)
    if cached_data:
        return UserResponse.model_validate_json(cached_data)

    user_service = UserService(db)
    result = await user_service.get_user_by_id(user_id)
    await cache_service.set(cache_key, result.model_dump_json())
    return result


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Actualizar usuario",
    description="Actualiza información de un usuario (solo admin)",
    dependencies=[Depends(require_admin)],
)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):

    user_service = UserService(db)
    result = await user_service.update_user(user_id, user_data, current_user)
    
    await cache_service.delete(f"user_detail:{user_id}")
    await cache_service.clear_pattern("users_list:*")
    
    return result


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar usuario",
    description="Elimina un usuario del sistema (solo admin)",
    dependencies=[Depends(require_admin)],
)
async def delete_user(
    user_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):

    user_service = UserService(db)
    await user_service.delete_user(user_id, current_user)
    
    await cache_service.delete(f"user_detail:{user_id}")
    await cache_service.clear_pattern("users_list:*")
    return None

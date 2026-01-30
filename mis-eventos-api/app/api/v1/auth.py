from typing import Annotated

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService
from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel.ext.asyncio.session import AsyncSession

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario",
    description="Crea una nueva cuenta de usuario con el rol 'attendee' por defecto",
)
async def register(user_data: UserCreate, db: Annotated[AsyncSession, Depends(get_db)]):

    auth_service = AuthService(db)
    return await auth_service.register(user_data)


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Iniciar sesión",
    description="Autentica al usuario y retorna un token de acceso JWT",
)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
):

    auth_service = AuthService(db)
    # Convertir OAuth2PasswordRequestForm a LoginRequest para mantener compatibilidad con el servicio
    # En OAuth2, el campo 'username' se usa para el identificador principal (email en este caso)
    login_data = LoginRequest(email=form_data.username, password=form_data.password)
    return await auth_service.login(login_data)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obtener perfil actual",
    description="Obtiene la información del usuario autenticado",
)
async def get_me(current_user: Annotated[User, Depends(get_current_active_user)]):

    return UserResponse.model_validate(current_user)

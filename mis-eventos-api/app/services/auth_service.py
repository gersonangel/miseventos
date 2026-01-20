from datetime import timedelta
from typing import Optional

from app.config import settings
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, LoginResponse, TokenData
from app.schemas.user import UserCreate, UserResponse
from app.utils.security import create_access_token, decode_access_token, verify_password
from fastapi import HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession


class AuthService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def register(self, user_data: UserCreate) -> UserResponse:

        # Verificar si el email ya existe
        if await self.user_repo.exists_by_email(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado",
            )

        # Crear usuario
        user = await self.user_repo.create(user_data)

        return UserResponse.model_validate(user)

    async def login(self, login_data: LoginRequest) -> LoginResponse:

        # Buscar usuario por email
        user = await self.user_repo.get_by_email(login_data.email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verificar contraseña
        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verificar que el usuario esté activo
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo"
            )

        # Crear token de acceso
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=access_token_expires,
        )

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    async def get_current_user(self, token: str) -> User:

        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudieron validar las credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = decode_access_token(token)
            user_id: str = payload.get("sub")

            if user_id is None:
                raise credentials_exception

            token_data = TokenData(user_id=user_id)
        except Exception:
            raise credentials_exception

        user = await self.user_repo.get_by_id(token_data.user_id)

        if user is None:
            raise credentials_exception

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo"
            )

        return user

from typing import List, Optional
from uuid import UUID

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse, UserUpdate
from app.utils.enums import UserRole
from fastapi import HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession


class UserService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def get_all_users(
        self, page: int = 1, size: int = 10, role: Optional[UserRole] = None
    ) -> dict:

        skip = (page - 1) * size
        users = await self.user_repo.get_all(skip=skip, limit=size, role=role)
        total = await self.user_repo.count(role=role)

        return {
            "total": total,
            "page": page,
            "size": size,
            "items": [UserResponse.model_validate(u) for u in users],
        }

    async def get_user_by_id(self, user_id: UUID) -> UserResponse:

        user = await self.user_repo.get_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
            )

        return UserResponse.model_validate(user)

    async def update_user(
        self, user_id: UUID, user_data: UserUpdate, current_user: User
    ) -> UserResponse:

        # Verificar que el usuario actual sea admin
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo administradores pueden actualizar usuarios",
            )

        user = await self.user_repo.update(user_id, user_data)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
            )

        return UserResponse.model_validate(user)

    async def delete_user(self, user_id: UUID, current_user: User) -> None:

        # Verificar que el usuario actual sea admin
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo administradores pueden eliminar usuarios",
            )

        # No permitir que se elimine a sí mismo
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes eliminar tu propio usuario",
            )

        success = await self.user_repo.delete(user_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
            )

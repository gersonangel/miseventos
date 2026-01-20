from typing import Annotated, List

from app.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService
from app.utils.enums import UserRole
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel.ext.asyncio.session import AsyncSession

# Esquema OAuth2 para obtener el token del header Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:

    auth_service = AuthService(db)
    return await auth_service.get_current_user(token)


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:

    # La validación de is_active ya se realiza en AuthService.get_current_user
    return current_user


class RoleChecker:

    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(
        self, current_user: Annotated[User, Depends(get_current_active_user)]
    ) -> User:

        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de estos roles: {[r.value for r in self.allowed_roles]}",
            )
        return current_user


# Dependencias predefinidas para roles específicos
require_admin = RoleChecker([UserRole.ADMIN])
require_organizer = RoleChecker([UserRole.ADMIN, UserRole.ORGANIZER])
require_authenticated = Depends(get_current_active_user)

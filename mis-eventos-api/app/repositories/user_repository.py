from typing import List, Optional
from uuid import UUID

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.utils.enums import UserRole
from app.utils.security import hash_password
from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession


class UserRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: UUID) -> Optional[User]:

        return await self.db.get(User, user_id)

    async def get_by_email(self, email: str) -> Optional[User]:

        statement = select(User).where(User.email == email)
        result = await self.db.exec(statement)
        return result.first()

    async def exists_by_email(self, email: str) -> bool:
        user = await self.get_by_email(email)
        return user is not None

    async def get_all(
        self, skip: int = 0, limit: int = 100, role: Optional[UserRole] = None
    ) -> List[User]:

        statement = select(User)

        if role:
            statement = statement.where(User.role == role)

        statement = statement.offset(skip).limit(limit)
        result = await self.db.exec(statement)
        return list(result.all())

    async def count(self, role: Optional[UserRole] = None) -> int:

        statement = select(func.count()).select_from(User)

        if role:
            statement = statement.where(User.role == role)

        result = await self.db.exec(statement)
        return result.one()

    async def create(self, user_data: UserCreate, role: UserRole = UserRole.ATTENDEE) -> User:

        hashed_password = hash_password(user_data.password)

        db_user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            role=role,
            is_active=True,
        )

        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)

        return db_user

    async def update(self, user_id: UUID, user_data: UserUpdate) -> Optional[User]:

        db_user = await self.get_by_id(user_id)
        if not db_user:
            return None

        user_data_dict = user_data.model_dump(exclude_unset=True)
        
        # Si se actualiza la contraseña, hay que hashearla
        if "password" in user_data_dict:
            password = user_data_dict.pop("password")
            if password:
                user_data_dict["hashed_password"] = hash_password(password)

        for key, value in user_data_dict.items():
            setattr(db_user, key, value)

        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user

    async def delete(self, user_id: UUID) -> bool:

        db_user = await self.get_by_id(user_id)
        if not db_user:
            return False

        await self.db.delete(db_user)
        await self.db.commit()
        return True

from typing import AsyncGenerator

from app.config import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

# Crear engine de SQLAlchemy (Asíncrono)
engine = create_async_engine(
    settings.DATABASE_URL, echo=settings.DATABASE_ECHO, future=True
)


AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:

    async with AsyncSessionLocal() as session:
        yield session

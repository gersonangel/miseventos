import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel.pool import StaticPool

from app.main import app
from app.database import get_db
from app.models.user import User
from app.utils.enums import UserRole
from app.utils.security import create_access_token, hash_password

# Use sqlite+aiosqlite for async sqlite
DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(name="session")
async def session_fixture():
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        
    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

@pytest.fixture(name="client")
async def client_fixture(session: AsyncSession):
    async def get_session_override():
        yield session

    app.dependency_overrides[get_db] = get_session_override
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
        
    app.dependency_overrides.clear()

@pytest.fixture
async def admin_user(session: AsyncSession) -> User:
    user = User(
        email="admin@test.com",
        full_name="Admin Test",
        hashed_password=hash_password("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

@pytest.fixture
async def organizer_user(session: AsyncSession) -> User:
    user = User(
        email="organizer@test.com",
        full_name="Organizer Test",
        hashed_password=hash_password("organizer123"),
        role=UserRole.ORGANIZER,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

@pytest.fixture
async def attendee_user(session: AsyncSession) -> User:
    user = User(
        email="attendee@test.com",
        full_name="Attendee Test",
        hashed_password=hash_password("attendee123"),
        role=UserRole.ATTENDEE,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

@pytest.fixture
def admin_token(admin_user: User) -> str:
    return create_access_token(
        data={"sub": str(admin_user.id), "email": admin_user.email}
    )

@pytest.fixture
def organizer_token(organizer_user: User) -> str:
    return create_access_token(
        data={"sub": str(organizer_user.id), "email": organizer_user.email}
    )

@pytest.fixture
def attendee_token(attendee_user: User) -> str:
    return create_access_token(
        data={"sub": str(attendee_user.id), "email": attendee_user.email}
    )

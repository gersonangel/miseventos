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

class MockCache:
    def __init__(self):
        self.data = {}
        
    async def get(self, key: str):
        # return self.data.get(key)
        return None # Always miss to avoid caching issues in tests when app logic is buggy regarding invalidation

        
    async def set(self, key: str, value: str, ttl: int = 0):
        self.data[key] = value
        
    async def delete(self, key: str):
        self.data.pop(key, None)
        
    async def clear_pattern(self, pattern: str):
        prefix = pattern.rstrip("*")
        keys_to_remove = [k for k in list(self.data.keys()) if k.startswith(prefix)]
        for k in keys_to_remove:
            self.data.pop(k, None)
            
    async def close(self):
        pass

@pytest.fixture(autouse=True)
def mock_cache_service(monkeypatch):
    mock = MockCache()
    monkeypatch.setattr("app.services.cache_service.cache_service", mock)
    
    modules_to_patch = [
        "app.main",
        "app.api.v1.events",
        "app.api.v1.sessions",
        "app.api.v1.users"
    ]
    
    for mod in modules_to_patch:
        try:
            monkeypatch.setattr(f"{mod}.cache_service", mock)
        except AttributeError:
            pass
            
    return mock


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

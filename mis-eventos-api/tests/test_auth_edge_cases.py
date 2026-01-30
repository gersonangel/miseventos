import pytest
from httpx import AsyncClient
from app.models.user import User
from app.utils.security import create_access_token
from sqlmodel.ext.asyncio.session import AsyncSession
from uuid import uuid4

@pytest.mark.asyncio
async def test_login_inactive_user(client: AsyncClient, session: AsyncSession, attendee_user: User):
    # Set user inactive
    attendee_user.is_active = False
    session.add(attendee_user)
    await session.commit()
    
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": attendee_user.email, "password": "attendee123"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Usuario inactivo"

@pytest.mark.asyncio
async def test_get_me_inactive_user(client: AsyncClient, session: AsyncSession, attendee_user: User):
    # Set user inactive
    attendee_user.is_active = False
    session.add(attendee_user)
    await session.commit()
    
    token = create_access_token(data={"sub": str(attendee_user.id)})
    
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Usuario inactivo"

@pytest.mark.asyncio
async def test_get_me_deleted_user(client: AsyncClient, session: AsyncSession):
    # Create token for non-existent user
    token = create_access_token(data={"sub": str(uuid4())})
    
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_me_token_no_sub(client: AsyncClient):
    # Token without sub
    token = create_access_token(data={"email": "test@test.com"})
    
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401

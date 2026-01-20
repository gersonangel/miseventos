import pytest
from httpx import AsyncClient
from app.models.user import User

@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient):

    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@test.com",
            "password": "password123",
            "full_name": "New User",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "attendee"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, attendee_user: User):

    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": attendee_user.email,
            "password": "password123",
            "full_name": "Another User",
        },
    )

    assert response.status_code == 400
    assert "ya está registrado" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, attendee_user: User):

    # OAuth2PasswordRequestForm expects username and password as form data
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": attendee_user.email, "password": "attendee123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == attendee_user.email


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, attendee_user: User):

    response = await client.post(
        "/api/v1/auth/login",
        data={"username": attendee_user.email, "password": "wrongpassword"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):

    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "nonexistent@test.com", "password": "password123"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, attendee_token: str, attendee_user: User):

    response = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {attendee_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == attendee_user.email
    assert data["role"] == "attendee"


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: AsyncClient):

    response = await client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer invalidtoken"}
    )

    assert response.status_code == 401

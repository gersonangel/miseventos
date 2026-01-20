import pytest
from httpx import AsyncClient
from app.models.user import User
from app.utils.enums import UserRole
import uuid

@pytest.mark.asyncio
async def test_get_users_admin(client: AsyncClient, admin_token: str, admin_user: User, attendee_user: User):
    response = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 2  # Admin + Attendee

@pytest.mark.asyncio
async def test_get_users_filter_role(client: AsyncClient, admin_token: str, admin_user: User):
    response = await client.get(
        "/api/v1/users",
        params={"role": "admin"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    items = data["items"]
    assert all(item["role"] == "admin" for item in items)
    assert data["total"] >= 1

@pytest.mark.asyncio
async def test_get_users_forbidden(client: AsyncClient, attendee_token: str):
    response = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {attendee_token}"}
    )
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_get_user_by_id_admin(client: AsyncClient, admin_token: str, attendee_user: User):
    response = await client.get(
        f"/api/v1/users/{attendee_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == attendee_user.email

@pytest.mark.asyncio
async def test_get_user_by_id_forbidden_non_admin(client: AsyncClient, attendee_token: str, attendee_user: User):
    response = await client.get(
        f"/api/v1/users/{attendee_user.id}",
        headers={"Authorization": f"Bearer {attendee_token}"}
    )
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_update_user_admin(client: AsyncClient, admin_token: str, attendee_user: User):
    response = await client.put(
        f"/api/v1/users/{attendee_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"full_name": "Updated Name By Admin"}
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Name By Admin"

@pytest.mark.asyncio
async def test_update_user_not_found(client: AsyncClient, admin_token: str):
    random_id = str(uuid.uuid4())
    response = await client.put(
        f"/api/v1/users/{random_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"full_name": "Updated Name"}
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_delete_user_admin(client: AsyncClient, admin_token: str, organizer_user: User):
    response = await client.delete(
        f"/api/v1/users/{organizer_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 204
    
    # Verify deletion
    response = await client.get(
        f"/api/v1/users/{organizer_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_delete_user_not_found(client: AsyncClient, admin_token: str):
    random_id = str(uuid.uuid4())
    response = await client.delete(
        f"/api/v1/users/{random_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_delete_self_admin(client: AsyncClient, admin_token: str, admin_user: User):
    response = await client.delete(
        f"/api/v1/users/{admin_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "No puedes eliminar tu propio usuario"

import pytest
from unittest.mock import AsyncMock
from uuid import uuid4
from app.services.user_service import UserService
from app.schemas.user import UserUpdate
from app.models.user import User
from app.utils.enums import UserRole
from fastapi import HTTPException

@pytest.mark.asyncio
async def test_user_service_defensive_checks():
    mock_db = AsyncMock()
    service = UserService(mock_db)
    
    # Mock non-admin user
    non_admin = User(id=uuid4(), email="test@test.com", role=UserRole.ATTENDEE)
    
    # Test update_user non-admin
    with pytest.raises(HTTPException) as exc:
        await service.update_user(uuid4(), UserUpdate(), non_admin)
    assert exc.value.status_code == 403
    assert "Solo administradores" in exc.value.detail

    # Test delete_user non-admin
    with pytest.raises(HTTPException) as exc:
        await service.delete_user(uuid4(), non_admin)
    assert exc.value.status_code == 403
    assert "Solo administradores" in exc.value.detail

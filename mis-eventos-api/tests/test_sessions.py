
import pytest
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from app.utils.enums import EventType, UserRole
from app.models.user import User

# Helpers
def future_date(days=0, hours=0):
    return (datetime.now(timezone.utc) + timedelta(days=days, hours=hours)).isoformat()

@pytest.fixture
async def event_id(client, admin_token):
    # Create a base event for session tests
    start_date = datetime.now(timezone.utc) + timedelta(days=1)
    end_date = start_date + timedelta(days=5)
    
    payload = {
        "title": "Session Test Event",
        "description": "Event for Session Tests",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "location": "Virtual",
        "max_capacity": 100,
        "event_type": EventType.CONFERENCE.value,
        "is_public": True,
        "image_desktop": "https://example.com/desktop.jpg",
        "image_mobile": "https://example.com/mobile.jpg"
    }
    resp = await client.post("/api/v1/events", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    event_id = resp.json()["id"]
    
    # Publish event so users can interact
    await client.put(f"/api/v1/events/{event_id}", json={"status": "published"}, headers={"Authorization": f"Bearer {admin_token}"})
    
    return event_id

@pytest.fixture
async def session_id(client, admin_token, event_id):
    # Create a base session
    start = datetime.fromisoformat(future_date(days=2)).replace(tzinfo=timezone.utc)
    end = start + timedelta(hours=1)
    
    payload = {
        "title": "Base Session",
        "description": "Base Description",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "location": "Room 101",
        "capacity": 20
    }
    resp = await client.post(f"/api/v1/sessions/events/{event_id}/sessions", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    return resp.json()["id"]

@pytest.mark.asyncio
async def test_create_session_success(client, admin_token, event_id):
    start = datetime.fromisoformat(future_date(days=2)).replace(tzinfo=timezone.utc)
    end = start + timedelta(hours=2)
    
    payload = {
        "title": "New Session",
        "description": "Deep Dive",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "location": "Room A",
        "capacity": 50
    }
    
    resp = await client.post(f"/api/v1/sessions/events/{event_id}/sessions", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == payload["title"]
    assert data["event_id"] == event_id

@pytest.mark.asyncio
async def test_create_session_invalid_dates(client, admin_token, event_id):
    start = datetime.fromisoformat(future_date(days=2)).replace(tzinfo=timezone.utc)
    end = start - timedelta(hours=1) # Invalid: End before Start
    
    payload = {
        "title": "Invalid Session",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "location": "Room B",
        "capacity": 50
    }
    
    resp = await client.post(f"/api/v1/sessions/events/{event_id}/sessions", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 422

@pytest.mark.asyncio
async def test_list_sessions(client, admin_token, event_id, session_id):
    resp = await client.get(f"/api/v1/sessions/events/{event_id}/sessions")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(s["id"] == session_id for s in data)

@pytest.mark.asyncio
async def test_get_session_detail(client, session_id):
    resp = await client.get(f"/api/v1/sessions/sessions/{session_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == session_id
    assert "speakers" in data

@pytest.mark.asyncio
async def test_update_session(client, admin_token, session_id):
    payload = {
        "title": "Updated Title",
        "location": "New Room"
    }
    resp = await client.put(f"/api/v1/sessions/sessions/{session_id}", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Updated Title"
    assert data["location"] == "New Room"

@pytest.mark.asyncio
async def test_delete_session(client, admin_token, session_id):
    resp = await client.delete(f"/api/v1/sessions/sessions/{session_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 204
    
    # Verify deletion
    get_resp = await client.get(f"/api/v1/sessions/sessions/{session_id}")
    assert get_resp.status_code == 404

@pytest.mark.asyncio
async def test_assign_speakers(client, admin_token, session_id, session):
    # Create a speaker user
    from app.utils.security import hash_password
    speaker = User(
        email="speaker@test.com",
        full_name="Speaker One",
        hashed_password=hash_password("pass"),
        role=UserRole.SPEAKER,
        is_active=True,
        biography="Expert in Python",
        organization="Tech Corp",
        position="Senior Dev"
    )
    session.add(speaker)
    await session.commit()
    await session.refresh(speaker)
    
    payload = {"speaker_ids": [str(speaker.id)]}
    resp = await client.post(f"/api/v1/sessions/sessions/{session_id}/speakers", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    
    # Verify assignment
    get_resp = await client.get(f"/api/v1/sessions/sessions/{session_id}")
    data = get_resp.json()
    assert len(data["speakers"]) == 1
    assert data["speakers"][0]["id"] == str(speaker.id)

@pytest.mark.asyncio
async def test_join_session(client, attendee_token, session_id, event_id):
    # 1. Register to Event first
    reg_resp = await client.post(f"/api/v1/events/{event_id}/register", headers={"Authorization": f"Bearer {attendee_token}"})
    assert reg_resp.status_code == 200

    # 2. Join Session
    resp = await client.post(f"/api/v1/sessions/sessions/{session_id}/join", headers={"Authorization": f"Bearer {attendee_token}"})
    assert resp.status_code == 200

@pytest.mark.asyncio
async def test_create_session_unauthorized(client, attendee_token, event_id):
    start = datetime.fromisoformat(future_date(days=2)).replace(tzinfo=timezone.utc)
    end = start + timedelta(hours=1)
    payload = {
        "title": "Hacked Session",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "location": "Room X",
        "capacity": 10
    }
    resp = await client.post(f"/api/v1/sessions/events/{event_id}/sessions", json=payload, headers={"Authorization": f"Bearer {attendee_token}"})
    assert resp.status_code == 403

@pytest.mark.asyncio
async def test_update_session_unauthorized(client, attendee_token, session_id):
    payload = {"title": "Hacked Title"}
    resp = await client.put(f"/api/v1/sessions/sessions/{session_id}", json=payload, headers={"Authorization": f"Bearer {attendee_token}"})
    assert resp.status_code == 403

@pytest.mark.asyncio
async def test_delete_session_unauthorized(client, attendee_token, session_id):
    resp = await client.delete(f"/api/v1/sessions/sessions/{session_id}", headers={"Authorization": f"Bearer {attendee_token}"})
    assert resp.status_code == 403

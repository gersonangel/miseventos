
import pytest
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from app.utils.enums import EventType

@pytest.mark.asyncio
async def test_create_session_success(client, admin_token, session):
    # 1. Create an Event
    start_date = datetime.now(timezone.utc) + timedelta(days=1)
    end_date = start_date + timedelta(days=2)
    
    event_payload = {
        "title": "Test Event",
        "description": "Event for Session Test",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "location": "Virtual",
        "max_capacity": 100,
        "event_type": EventType.CONFERENCE.value,
        "is_public": True,
        "image_desktop": "https://example.com/desktop.jpg",
        "image_mobile": "https://example.com/mobile.jpg"
    }
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.post("/api/v1/events", json=event_payload, headers=headers)
    assert resp.status_code == 201
    event_id = resp.json()["id"]

    # 2. Create a Session
    session_start = start_date + timedelta(hours=1)
    session_end = session_start + timedelta(hours=1)
    
    session_payload = {
        "title": "Test Session",
        "description": "A deep dive",
        "start_time": session_start.isoformat(),
        "end_time": session_end.isoformat(),
        "location": "Room A",
        "capacity": 50
    }
    
    resp = await client.post(f"/api/v1/sessions/events/{event_id}/sessions", json=session_payload, headers=headers)
    
    # Debug info if fails
    if resp.status_code != 201:
        print(f"Error: {resp.json()}")
        
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == session_payload["title"]
    assert data["event_id"] == event_id

@pytest.mark.asyncio
async def test_create_session_invalid_dates(client, admin_token, session):
    # 1. Create an Event
    start_date = datetime.now(timezone.utc) + timedelta(days=1)
    end_date = start_date + timedelta(days=2)
    
    event_payload = {
        "title": "Test Event 2",
        "description": "Event for Session Test 2",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "location": "Virtual",
        "max_capacity": 100,
        "event_type": EventType.CONFERENCE.value,
        "image_desktop": "https://example.com/desktop.jpg",
        "image_mobile": "https://example.com/mobile.jpg"
    }
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.post("/api/v1/events", json=event_payload, headers=headers)
    event_id = resp.json()["id"]

    # 2. Create a Session with end_time < start_time
    session_start = start_date + timedelta(hours=2)
    session_end = session_start - timedelta(hours=1) # Invalid
    
    session_payload = {
        "title": "Invalid Session",
        "start_time": session_start.isoformat(),
        "end_time": session_end.isoformat(),
        "location": "Room B",
        "capacity": 50
    }
    
    resp = await client.post(f"/api/v1/sessions/events/{event_id}/sessions", json=session_payload, headers=headers)
    
    assert resp.status_code == 422
    # Verify the error message relates to the date validator
    errors = resp.json()["detail"]
    assert any("La hora de finalización debe ser posterior a la de inicio" in e["msg"] for e in errors)

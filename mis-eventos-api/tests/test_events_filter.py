import pytest
from httpx import AsyncClient
from app.models.event import Event
from app.models.registration import EventRegistration
from app.models.user import User
from app.utils.enums import EventStatus, EventType
from datetime import datetime, timedelta, timezone

@pytest.mark.asyncio
async def test_filter_available_spots(
    client: AsyncClient, 
    session, 
    organizer_user: User, 
    attendee_user: User
):
    # 1. Create Event with spots (Capacity 10, 0 registrations)
    event_available = Event(
        title="Event Available",
        description="Description with more than 10 characters",
        image_desktop="http://example.com/desktop.jpg",
        image_mobile="http://example.com/mobile.jpg",
        start_date=datetime.now(timezone.utc) + timedelta(days=1),
        end_date=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        location="Loc",
        max_capacity=10,
        event_type=EventType.CONFERENCE,
        status=EventStatus.PUBLISHED,
        organizer_id=organizer_user.id
    )
    session.add(event_available)
    
    # 2. Create Full Event (Capacity 1, 1 registration)
    event_full = Event(
        title="Event Full",
        description="Description with more than 10 characters",
        image_desktop="http://example.com/desktop.jpg",
        image_mobile="http://example.com/mobile.jpg",
        start_date=datetime.now(timezone.utc) + timedelta(days=2),
        end_date=datetime.now(timezone.utc) + timedelta(days=2, hours=2),
        location="Loc",
        max_capacity=1,
        event_type=EventType.WORKSHOP,
        status=EventStatus.PUBLISHED,
        organizer_id=organizer_user.id
    )
    session.add(event_full)
    await session.commit()
    await session.refresh(event_available)
    await session.refresh(event_full)

    # Register attendee to event_full
    registration = EventRegistration(
        event_id=event_full.id,
        user_id=attendee_user.id,
        is_active=True,
        registered_at=datetime.now(timezone.utc)
    )
    session.add(registration)
    await session.commit()

    # 3. Query without filter (Should return both)
    # Note: Default limit is 10
    response = await client.get("/api/v1/events")
    assert response.status_code == 200
    data = response.json()
    # Depending on other tests, there might be more events, but we check if our events are present
    ids = [item["id"] for item in data]
    assert str(event_available.id) in ids
    assert str(event_full.id) in ids

    # 4. Query with filter (Should return only event_available)
    response = await client.get("/api/v1/events?available_spots_only=true")
    assert response.status_code == 200
    data = response.json()
    ids = [item["id"] for item in data]
    assert str(event_available.id) in ids
    assert str(event_full.id) not in ids

import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

from app.services.session_service import SessionService
from app.schemas.session import SessionCreate, SessionUpdate
from app.models.event import Event
from app.models.session import Session
from app.models.user import User
from app.utils.enums import UserRole, EventStatus

@pytest.fixture
def mock_repos():
    return {
        "session": AsyncMock(),
        "event": AsyncMock(),
        "user": AsyncMock()
    }

@pytest.fixture
def service(mock_repos):
    return SessionService(mock_repos["session"], mock_repos["event"], mock_repos["user"])

@pytest.mark.asyncio
async def test_create_session_event_not_found(service, mock_repos):
    mock_repos["event"].get_by_id.return_value = None
    
    with pytest.raises(HTTPException) as exc:
        await service.create_session(uuid4(), MagicMock())
    assert exc.value.status_code == 404
    assert "Evento no encontrado" in exc.value.detail

@pytest.mark.asyncio
async def test_create_session_dates_out_of_range(service, mock_repos):
    future_now = datetime.now(timezone.utc) + timedelta(days=10)
    event = Event(
        id=uuid4(), 
        start_date=future_now, 
        end_date=future_now + timedelta(days=1),
        max_capacity=100
    )
    mock_repos["event"].get_by_id.return_value = event
    
    # Session starts before event but in future (to pass Pydantic)
    session_data = SessionCreate(
        title="Test",
        description="Desc",
        start_time=future_now - timedelta(hours=1),
        end_time=future_now + timedelta(hours=1),
        capacity=50,
        location="Room 1"
    )
    
    with pytest.raises(HTTPException) as exc:
        await service.create_session(event.id, session_data)
    assert "fechas de la sesión deben estar dentro" in exc.value.detail

@pytest.mark.asyncio
async def test_create_session_capacity_exceeded(service, mock_repos):
    future_now = datetime.now(timezone.utc) + timedelta(days=10)
    event = Event(
        id=uuid4(), 
        start_date=future_now, 
        end_date=future_now + timedelta(days=1),
        max_capacity=100
    )
    mock_repos["event"].get_by_id.return_value = event
    
    session_data = SessionCreate(
        title="Test",
        description="Desc",
        start_time=event.start_date + timedelta(hours=1),
        end_time=event.start_date + timedelta(hours=2),
        capacity=101, # > 100
        location="Room 1"
    )
    
    with pytest.raises(HTTPException) as exc:
        await service.create_session(event.id, session_data)
    assert "capacidad de la sesión no puede exceder" in exc.value.detail

@pytest.mark.asyncio
async def test_create_session_short_duration(service, mock_repos):
    future_now = datetime.now(timezone.utc) + timedelta(days=10)
    event = Event(
        id=uuid4(), 
        start_date=future_now, 
        end_date=future_now + timedelta(days=1),
        max_capacity=100
    )
    mock_repos["event"].get_by_id.return_value = event
    
    start_time = event.start_date + timedelta(hours=1)
    # Duration 10 mins (valid order, short duration)
    session_data = SessionCreate(
        title="Test",
        description="Desc",
        start_time=start_time,
        end_time=start_time + timedelta(minutes=10), 
        capacity=50,
        location="Room 1"
    )
    
    with pytest.raises(HTTPException) as exc:
        await service.create_session(event.id, session_data)
    assert "duración de la sesión debe ser de al menos 15 minutos" in exc.value.detail

@pytest.mark.asyncio
async def test_update_session_started(service, mock_repos):
    # Session started in the past
    session = Session(
        id=uuid4(),
        event_id=uuid4(),
        start_time=datetime.now(timezone.utc) - timedelta(hours=1),
        end_time=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    mock_repos["session"].get_by_id.return_value = session
    
    with pytest.raises(HTTPException) as exc:
        await service.update_session(session.id, SessionUpdate(title="New Title"))
    assert "No se puede editar una sesión que ya ha comenzado" in exc.value.detail

@pytest.mark.asyncio
async def test_update_session_invalid_times(service, mock_repos):
    future_start = datetime.now(timezone.utc) + timedelta(days=1)
    session = Session(
        id=uuid4(),
        event_id=uuid4(),
        start_time=future_start,
        end_time=future_start + timedelta(hours=1)
    )
    mock_repos["session"].get_by_id.return_value = session
    
    # Update start to be after end (only providing start to bypass Pydantic check which checks both)
    # Pydantic validator checks if BOTH are present. 
    # Service checks if new_start > (new_end or old_end).
    
    update_data = SessionUpdate(
        start_time=session.end_time + timedelta(minutes=1)
    )
    
    with pytest.raises(HTTPException) as exc:
        await service.update_session(session.id, update_data)
    assert "hora de finalización debe ser posterior" in exc.value.detail

@pytest.mark.asyncio
async def test_update_session_short_duration(service, mock_repos):
    future_start = datetime.now(timezone.utc) + timedelta(days=1)
    session = Session(
        id=uuid4(),
        event_id=uuid4(),
        start_time=future_start,
        end_time=future_start + timedelta(hours=1)
    )
    mock_repos["session"].get_by_id.return_value = session
    
    update_data = SessionUpdate(
        start_time=future_start,
        end_time=future_start + timedelta(minutes=10)
    )
    
    with pytest.raises(HTTPException) as exc:
        await service.update_session(session.id, update_data)
    assert "duración de la sesión debe ser de al menos 15 minutos" in exc.value.detail

@pytest.mark.asyncio
async def test_update_session_out_of_event_range(service, mock_repos):
    future_start = datetime.now(timezone.utc) + timedelta(days=1)
    session = Session(
        id=uuid4(),
        event_id=uuid4(),
        start_time=future_start,
        end_time=future_start + timedelta(hours=1)
    )
    mock_repos["session"].get_by_id.return_value = session
    
    event = Event(
        id=session.event_id,
        start_date=future_start,
        end_date=future_start + timedelta(hours=5),
        max_capacity=100
    )
    mock_repos["event"].get_by_id.return_value = event
    
    # Update to outside range
    update_data = SessionUpdate(
        start_time=future_start - timedelta(hours=1)
    )
    
    with pytest.raises(HTTPException) as exc:
        await service.update_session(session.id, update_data)
    assert "fechas de la sesión deben estar dentro" in exc.value.detail

@pytest.mark.asyncio
async def test_update_session_capacity_exceeded(service, mock_repos):
    future_start = datetime.now(timezone.utc) + timedelta(days=1)
    session = Session(
        id=uuid4(),
        event_id=uuid4(),
        start_time=future_start,
        end_time=future_start + timedelta(hours=1)
    )
    mock_repos["session"].get_by_id.return_value = session
    
    event = Event(
        id=session.event_id,
        max_capacity=100
    )
    mock_repos["event"].get_by_id.return_value = event
    
    update_data = SessionUpdate(capacity=101)
    
    with pytest.raises(HTTPException) as exc:
        await service.update_session(session.id, update_data)
    assert "capacidad de la sesión no puede exceder" in exc.value.detail

@pytest.mark.asyncio
async def test_assign_speaker_user_not_found(service, mock_repos):
    session = Session(id=uuid4())
    mock_repos["session"].get_by_id.return_value = session
    mock_repos["user"].get_by_id.return_value = None
    
    with pytest.raises(HTTPException) as exc:
        await service.assign_speakers(session.id, [uuid4()])
    assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_assign_speaker_wrong_role(service, mock_repos):
    session = Session(id=uuid4())
    mock_repos["session"].get_by_id.return_value = session
    
    user = User(id=uuid4(), role=UserRole.ATTENDEE, email="test@test.com")
    mock_repos["user"].get_by_id.return_value = user
    
    with pytest.raises(HTTPException) as exc:
        await service.assign_speakers(session.id, [user.id])
    assert "no es un ponente" in exc.value.detail

@pytest.mark.asyncio
async def test_assign_speaker_incomplete_profile(service, mock_repos):
    session = Session(id=uuid4())
    mock_repos["session"].get_by_id.return_value = session
    
    user = User(
        id=uuid4(), 
        role=UserRole.SPEAKER, 
        email="test@test.com",
        biography=None # Missing
    )
    mock_repos["user"].get_by_id.return_value = user
    
    with pytest.raises(HTTPException) as exc:
        await service.assign_speakers(session.id, [user.id])
    assert "perfil del ponente" in exc.value.detail

@pytest.mark.asyncio
async def test_assign_speaker_conflict(service, mock_repos):
    session = Session(
        id=uuid4(),
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    mock_repos["session"].get_by_id.return_value = session
    
    user = User(
        id=uuid4(), 
        role=UserRole.SPEAKER, 
        email="test@test.com",
        biography="Bio",
        organization="Org",
        position="Pos"
    )
    mock_repos["user"].get_by_id.return_value = user
    
    conflict_session = Session(id=uuid4(), title="Conflict")
    mock_repos["session"].get_speaker_sessions_in_range.return_value = [conflict_session]
    
    with pytest.raises(HTTPException) as exc:
        await service.assign_speakers(session.id, [user.id])
    assert "conflicto de horario" in exc.value.detail

@pytest.mark.asyncio
async def test_join_session_not_registered(service, mock_repos):
    session = Session(id=uuid4(), event_id=uuid4())
    mock_repos["session"].get_by_id.return_value = session
    mock_repos["event"].get_registration.return_value = None
    
    with pytest.raises(HTTPException) as exc:
        await service.join_session(session.id, uuid4())
    assert "registrado en el evento" in exc.value.detail

@pytest.mark.asyncio
async def test_join_session_full(service, mock_repos):
    session = Session(id=uuid4(), event_id=uuid4(), capacity=10)
    mock_repos["session"].get_by_id.return_value = session
    
    reg = MagicMock()
    reg.is_active = True
    mock_repos["event"].get_registration.return_value = reg
    
    mock_repos["session"].count_attendees.return_value = 10
    
    with pytest.raises(HTTPException) as exc:
        await service.join_session(session.id, uuid4())
    assert "sesión está llena" in exc.value.detail

@pytest.mark.asyncio
async def test_join_session_already_joined(service, mock_repos):
    session = Session(id=uuid4(), event_id=uuid4(), capacity=10)
    mock_repos["session"].get_by_id.return_value = session
    
    reg = MagicMock()
    reg.is_active = True
    mock_repos["event"].get_registration.return_value = reg
    
    mock_repos["session"].count_attendees.return_value = 5
    mock_repos["session"].get_attendee_link.return_value = MagicMock()
    
    await service.join_session(session.id, uuid4())
    # Should return without adding
    mock_repos["session"].add_attendee.assert_not_called()

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta, timezone
from app.jobs.event_jobs import update_finished_events
from app.scheduler import start_scheduler, stop_scheduler
from app.utils.enums import EventStatus
from app.models.event import Event

@pytest.mark.asyncio
async def test_update_finished_events():
    # Mock session
    mock_session = AsyncMock()
    
    # Mock result for select
    mock_event = Event(
        id="123",
        title="Old Event",
        start_date=datetime.now(timezone.utc) - timedelta(hours=5),
        end_date=datetime.now(timezone.utc) - timedelta(hours=2),
        status=EventStatus.PUBLISHED
    )
    
    mock_result = MagicMock()
    mock_result.all.return_value = [mock_event]
    
    # Configure exec to return mock_result when awaited
    mock_session.exec.return_value = mock_result
    
    # Mock AsyncSessionLocal to return our mock_session
    # AsyncSessionLocal is a class/callable that returns a session context manager
    # async with AsyncSessionLocal() as session:
    # So we need AsyncSessionLocal() -> mock_session_ctx
    # mock_session_ctx.__aenter__ -> mock_session
    
    mock_session_ctx = AsyncMock()
    mock_session_ctx.__aenter__.return_value = mock_session
    
    with patch("app.jobs.event_jobs.AsyncSessionLocal", return_value=mock_session_ctx):
        await update_finished_events()
        
    # Verify event status was updated
    assert mock_event.status == EventStatus.FINISHED
    mock_session.add.assert_called_with(mock_event)
    mock_session.commit.assert_called_once()

@pytest.mark.asyncio
async def test_update_finished_events_no_events():
    # Mock session
    mock_session = AsyncMock()
    
    mock_result = MagicMock()
    mock_result.all.return_value = []
    
    mock_session.exec.return_value = mock_result
    
    mock_session_ctx = AsyncMock()
    mock_session_ctx.__aenter__.return_value = mock_session
    
    with patch("app.jobs.event_jobs.AsyncSessionLocal", return_value=mock_session_ctx):
        await update_finished_events()
        
    mock_session.add.assert_not_called()
    mock_session.commit.assert_not_called()

def test_start_scheduler():
    with patch("app.scheduler.scheduler") as mock_scheduler:
        mock_scheduler.running = False
        start_scheduler()
        mock_scheduler.add_job.assert_called_once()
        mock_scheduler.start.assert_called_once()

def test_start_scheduler_already_running():
    with patch("app.scheduler.scheduler") as mock_scheduler:
        mock_scheduler.running = True
        start_scheduler()
        mock_scheduler.start.assert_not_called()

def test_start_scheduler_error():
    with patch("app.scheduler.scheduler") as mock_scheduler:
        mock_scheduler.running = False
        mock_scheduler.start.side_effect = Exception("Boom")
        # Should not raise exception as it logs it
        start_scheduler()

def test_stop_scheduler():
    with patch("app.scheduler.scheduler") as mock_scheduler:
        mock_scheduler.running = True
        stop_scheduler()
        mock_scheduler.shutdown.assert_called_once()

def test_stop_scheduler_not_running():
    with patch("app.scheduler.scheduler") as mock_scheduler:
        mock_scheduler.running = False
        stop_scheduler()
        mock_scheduler.shutdown.assert_not_called()

def test_stop_scheduler_error():
    with patch("app.scheduler.scheduler") as mock_scheduler:
        mock_scheduler.running = True
        mock_scheduler.shutdown.side_effect = Exception("Boom")
        stop_scheduler()

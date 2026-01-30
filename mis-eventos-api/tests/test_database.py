import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from app.database import get_db

@pytest.mark.asyncio
async def test_get_db():
    # Mock session
    mock_session = AsyncMock()
    
    # Mock context manager returned by AsyncSessionLocal()
    mock_context = AsyncMock()
    mock_context.__aenter__.return_value = mock_session
    mock_context.__aexit__.return_value = None
    
    # Mock AsyncSessionLocal class/callable
    mock_session_local = MagicMock(return_value=mock_context)
    
    with patch("app.database.AsyncSessionLocal", mock_session_local):
        async for session in get_db():
            assert session is mock_session
        
        # Verify session was created
        mock_session_local.assert_called_once()
        # Verify context manager was entered/exited
        mock_context.__aenter__.assert_called_once()
        mock_context.__aexit__.assert_called_once()

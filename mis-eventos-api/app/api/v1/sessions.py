from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.session import SessionCreate, SessionResponse, SessionUpdate, SpeakerAssign
from app.services.session_service import SessionService
from app.repositories.session_repository import SessionRepository
from app.repositories.event_repository import EventRepository
from app.repositories.user_repository import UserRepository
from app.utils.enums import UserRole

router = APIRouter(prefix="/sessions", tags=["Sesiones"])

def get_session_service(db: AsyncSession = Depends(get_db)) -> SessionService:
    return SessionService(
        SessionRepository(db),
        EventRepository(db),
        UserRepository(db)
    )

@router.post("/events/{event_id}/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    event_id: UUID,
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.ORGANIZER]:
         raise HTTPException(status_code=403, detail="Not authorized to create sessions")
    # Nota: Idealmente verificar que el organizador sea dueño del evento
    return await service.create_session(event_id, session_data)

@router.get("/events/{event_id}/sessions", response_model=List[SessionResponse])
async def list_sessions(
    event_id: UUID,
    service: SessionService = Depends(get_session_service)
):
    return await service.list_sessions(event_id)

@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: UUID,
    service: SessionService = Depends(get_session_service)
):
    return await service.get_session(session_id)

@router.put("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: UUID,
    session_data: SessionUpdate,
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.ORGANIZER]:
         raise HTTPException(status_code=403, detail="Not authorized to update sessions")
    return await service.update_session(session_id, session_data)

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.ORGANIZER]:
         raise HTTPException(status_code=403, detail="Not authorized to delete sessions")
    await service.delete_session(session_id)

@router.post("/sessions/{session_id}/speakers", status_code=status.HTTP_200_OK)
async def assign_speakers(
    session_id: UUID,
    data: SpeakerAssign,
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.ORGANIZER]:
        raise HTTPException(status_code=403, detail="Not authorized to assign speakers")
    await service.assign_speakers(session_id, data.speaker_ids)
    return {"message": "Speakers assigned successfully"}

@router.post("/sessions/{session_id}/join", status_code=status.HTTP_200_OK)
async def join_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SessionService = Depends(get_session_service)
):
    await service.join_session(session_id, current_user.id)
    return {"message": "Joined session successfully"}

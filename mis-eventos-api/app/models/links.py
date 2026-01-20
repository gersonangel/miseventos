from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Field, SQLModel
from sqlalchemy import DateTime

def utc_now():
    return datetime.now(timezone.utc)

# Tablas intermedias
class SessionSpeakerLink(SQLModel, table=True):
    __tablename__ = "session_speaker_links"
    session_id: UUID = Field(foreign_key="sessions.id", primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", primary_key=True)

class SessionAttendeeLink(SQLModel, table=True):
    __tablename__ = "session_attendee_links"
    session_id: UUID = Field(foreign_key="sessions.id", primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", primary_key=True)
    joined_at: datetime = Field(default_factory=utc_now, sa_type=DateTime(timezone=True))

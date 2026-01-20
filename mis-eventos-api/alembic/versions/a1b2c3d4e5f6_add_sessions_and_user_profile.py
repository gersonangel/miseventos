"""add_sessions_and_user_profile

Revision ID: a1b2c3d4e5f6
Revises: 4c89cc4fee6d
Create Date: 2026-01-20 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '4c89cc4fee6d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users columns
    op.add_column('users', sa.Column('biography', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('organization', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=True))
    op.add_column('users', sa.Column('position', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
    op.add_column('users', sa.Column('profile_picture', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

    # Sessions table
    op.create_table('sessions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('location', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Session Speaker Link
    op.create_table('session_speaker_links',
        sa.Column('session_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('session_id', 'user_id')
    )

    # Session Attendee Link
    op.create_table('session_attendee_links',
        sa.Column('session_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('session_id', 'user_id')
    )


def downgrade() -> None:
    op.drop_table('session_attendee_links')
    op.drop_table('session_speaker_links')
    op.drop_table('sessions')
    op.drop_column('users', 'profile_picture')
    op.drop_column('users', 'position')
    op.drop_column('users', 'organization')
    op.drop_column('users', 'biography')

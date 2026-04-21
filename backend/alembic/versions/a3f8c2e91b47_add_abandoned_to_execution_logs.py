"""add abandoned to execution_logs

Revision ID: a3f8c2e91b47
Revises: 52949402356c
Create Date: 2026-04-20 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a3f8c2e91b47"
down_revision: Union[str, Sequence[str], None] = "52949402356c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "execution_logs",
        sa.Column("abandoned", sa.Boolean(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("execution_logs", "abandoned")

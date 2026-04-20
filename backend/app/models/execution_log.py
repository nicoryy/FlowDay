import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import UUIDType, new_uuid


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    task_id: Mapped[str] = mapped_column(
        UUIDType, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    work_session_id: Mapped[str | None] = mapped_column(
        UUIDType, ForeignKey("work_sessions.id", ondelete="SET NULL"), nullable=True
    )
    actual_start: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    actual_end: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=_now
    )

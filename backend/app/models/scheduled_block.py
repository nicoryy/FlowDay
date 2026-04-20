import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import UUIDType, new_uuid


class ScheduledBlock(Base):
    __tablename__ = "scheduled_blocks"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    task_id: Mapped[str] = mapped_column(
        UUIDType, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    work_session_id: Mapped[str] = mapped_column(
        UUIDType, ForeignKey("work_sessions.id", ondelete="CASCADE"), nullable=False
    )
    planned_start: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    planned_end: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    task: Mapped["app.models.task.Task"] = relationship("Task", lazy="select")  # type: ignore[name-defined]
    work_session: Mapped["app.models.work_session.WorkSession"] = relationship(  # type: ignore[name-defined]
        "WorkSession", lazy="select"
    )

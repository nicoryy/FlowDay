import datetime

from sqlalchemy import Date, DateTime, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import UUIDType, new_uuid


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


class WorkSession(Base):
    __tablename__ = "work_sessions"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    work_start: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    work_end: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    config_snapshot: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=_now
    )

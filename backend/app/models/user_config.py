from sqlalchemy import Boolean, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column
import datetime

from app.database import Base


class UserConfig(Base):
    __tablename__ = "user_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    default_work_start: Mapped[datetime.time] = mapped_column(
        Time, default=datetime.time(9, 0)
    )
    default_work_end: Mapped[datetime.time] = mapped_column(
        Time, default=datetime.time(18, 0)
    )
    break_duration_min: Mapped[int] = mapped_column(Integer, default=5)
    break_interval_min: Mapped[int] = mapped_column(Integer, default=50)
    timezone: Mapped[str] = mapped_column(String(50), default="America/Fortaleza")
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

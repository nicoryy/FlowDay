import datetime
from typing import Literal

from pydantic import BaseModel


class DailyStat(BaseModel):
    date: datetime.date
    scheduled: int
    done: int
    logged_minutes: int
    completion_rate: float


class PriorityStat(BaseModel):
    priority: int
    label: str
    done: int
    total_minutes: int


class StatsSummary(BaseModel):
    total_scheduled: int
    total_done: int
    completion_rate: float
    total_logged_minutes: int
    avg_deviation_minutes: float


class StatsResponse(BaseModel):
    period: Literal["day", "week"]
    date_from: datetime.date
    date_to: datetime.date
    summary: StatsSummary
    daily: list[DailyStat]
    by_priority: list[PriorityStat]

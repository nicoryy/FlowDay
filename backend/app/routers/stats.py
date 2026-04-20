import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query

from app.deps import get_stats_service
from app.schemas.stats import StatsResponse
from app.services.stats_service import StatsService

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=StatsResponse)
async def get_stats(
    period: Literal["day", "week"] = Query(default="week"),
    date: datetime.date = Query(default_factory=datetime.date.today),
    service: StatsService = Depends(get_stats_service),
) -> StatsResponse:
    return await service.compute(period, date)

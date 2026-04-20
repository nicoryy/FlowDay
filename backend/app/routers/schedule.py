import datetime

from fastapi import APIRouter, Depends, status

from app.deps import get_config_repo, get_scheduler_service
from app.repositories.config_repository import ConfigRepository
from app.schemas.schedule import ScheduleRequest, ScheduleResponse
from app.services.scheduler_service import SchedulerService

router = APIRouter(prefix="/api/schedule", tags=["schedule"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ScheduleResponse)
async def generate_schedule(
    payload: ScheduleRequest,
    service: SchedulerService = Depends(get_scheduler_service),
    config_repo: ConfigRepository = Depends(get_config_repo),
) -> ScheduleResponse:
    config = await config_repo.get_or_create()
    return await service.generate(
        date=payload.date,
        config=config,
        work_start=payload.work_start,
        work_end=payload.work_end,
    )


@router.get("/{date}", response_model=ScheduleResponse)
async def get_schedule(
    date: datetime.date,
    service: SchedulerService = Depends(get_scheduler_service),
) -> ScheduleResponse:
    return await service.get(date)


@router.delete("/{date}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    date: datetime.date,
    service: SchedulerService = Depends(get_scheduler_service),
) -> None:
    await service.delete(date)

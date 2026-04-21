import datetime

from fastapi import APIRouter, Depends, Query, status

from app.deps import get_log_service
from app.schemas.log import ExecutionLogCreate, ExecutionLogRead, ExecutionLogRevertRead, ExecutionLogUpdate
from app.services.log_service import LogService

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ExecutionLogRead)
async def start_execution(
    payload: ExecutionLogCreate,
    service: LogService = Depends(get_log_service),
) -> ExecutionLogRead:
    return await service.start(payload)


@router.patch("/{log_id}", response_model=ExecutionLogRead)
async def update_execution(
    log_id: str,
    payload: ExecutionLogUpdate,
    service: LogService = Depends(get_log_service),
) -> ExecutionLogRead:
    return await service.update(log_id, payload)


@router.get("", response_model=list[ExecutionLogRead])
async def list_logs(
    date: datetime.date | None = Query(default=None),
    task_id: str | None = Query(default=None),
    service: LogService = Depends(get_log_service),
) -> list[ExecutionLogRead]:
    return await service.list(date=date, task_id=task_id)


@router.get("/active/{task_id}", response_model=ExecutionLogRead | None)
async def get_active_log(
    task_id: str,
    service: LogService = Depends(get_log_service),
) -> ExecutionLogRead | None:
    return await service.get_active(task_id)


@router.post("/revert/{task_id}", response_model=ExecutionLogRevertRead)
async def revert_task(
    task_id: str,
    service: LogService = Depends(get_log_service),
) -> ExecutionLogRevertRead:
    """Abandon the most recent log and reset the task to pending."""
    return await service.revert(task_id)

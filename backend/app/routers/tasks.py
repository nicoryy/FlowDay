from fastapi import APIRouter, Depends, Query, status

from app.deps import get_task_service
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services.task_service import TaskService

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TaskRead)
async def create_task(
    payload: TaskCreate,
    service: TaskService = Depends(get_task_service),
) -> TaskRead:
    return await service.create(payload)


@router.get("", response_model=list[TaskRead])
async def list_tasks(
    status: str | None = Query(default=None),
    priority: int | None = Query(default=None, ge=1, le=3),
    service: TaskService = Depends(get_task_service),
) -> list[TaskRead]:
    return await service.list(status_filter=status, priority=priority)


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(
    task_id: str,
    service: TaskService = Depends(get_task_service),
) -> TaskRead:
    return await service.get(task_id)


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    service: TaskService = Depends(get_task_service),
) -> TaskRead:
    return await service.update(task_id, payload)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    service: TaskService = Depends(get_task_service),
) -> None:
    await service.delete(task_id)

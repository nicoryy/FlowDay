import logging

from fastapi import HTTPException, status

from app.models.task import Task, TaskStatus
from app.repositories.audit_repository import AuditRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate

logger = logging.getLogger(__name__)

VALID_TRANSITIONS: dict[str, set[str]] = {
    TaskStatus.pending.value: {
        TaskStatus.scheduled.value,
        TaskStatus.in_progress.value,
        TaskStatus.skipped.value,
    },
    TaskStatus.scheduled.value: {
        TaskStatus.pending.value,
        TaskStatus.in_progress.value,
        TaskStatus.overflow.value,
        TaskStatus.skipped.value,
    },
    TaskStatus.in_progress.value: {
        TaskStatus.done.value,
        TaskStatus.pending.value,
        TaskStatus.skipped.value,
    },
    TaskStatus.done.value: set(),
    TaskStatus.skipped.value: {TaskStatus.pending.value},
    TaskStatus.overflow.value: {TaskStatus.pending.value, TaskStatus.scheduled.value},
}


class TaskService:
    def __init__(self, repo: TaskRepository, audit: AuditRepository) -> None:
        self._repo = repo
        self._audit = audit

    async def create(self, payload: TaskCreate) -> TaskRead:
        task = Task(
            title=payload.title,
            description=payload.description,
            estimated_minutes=payload.estimated_minutes,
            priority=payload.priority,
        )
        task = await self._repo.create(task)
        await self._audit.log("task.created", {"id": task.id, "title": task.title})
        logger.info("Task created: %s", task.id)
        return TaskRead.model_validate(task)

    async def get(self, task_id: str) -> TaskRead:
        task = await self._repo.get_by_id(task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return TaskRead.model_validate(task)

    async def list(self, status_filter: str | None, priority: int | None) -> list[TaskRead]:
        tasks = await self._repo.list(status=status_filter, priority=priority)
        return [TaskRead.model_validate(t) for t in tasks]

    async def update(self, task_id: str, payload: TaskUpdate) -> TaskRead:
        task = await self._repo.get_by_id(task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

        if payload.status is not None:
            allowed = VALID_TRANSITIONS.get(task.status, set())
            if payload.status.value not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Cannot transition from '{task.status}' to '{payload.status.value}'",
                )
            task.status = payload.status.value

        if payload.title is not None:
            task.title = payload.title
        if payload.description is not None:
            task.description = payload.description
        if payload.estimated_minutes is not None:
            task.estimated_minutes = payload.estimated_minutes
        if payload.priority is not None:
            task.priority = payload.priority

        task = await self._repo.update(task)
        await self._audit.log("task.updated", {"id": task.id})
        return TaskRead.model_validate(task)

    async def delete(self, task_id: str) -> None:
        task = await self._repo.get_by_id(task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        await self._audit.log("task.deleted", {"id": task.id, "title": task.title})
        await self._repo.delete(task)
        logger.info("Task deleted: %s", task_id)

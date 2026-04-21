import datetime
import logging

from fastapi import HTTPException, status

from app.models.execution_log import ExecutionLog
from app.models.task import TaskStatus
from app.repositories.audit_repository import AuditRepository
from app.repositories.log_repository import LogRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.log import ExecutionLogCreate, ExecutionLogRead, ExecutionLogRevertRead, ExecutionLogUpdate

logger = logging.getLogger(__name__)


class LogService:
    def __init__(
        self,
        db_session,  # type: ignore[no-untyped-def]
        log_repo: LogRepository,
        task_repo: TaskRepository,
        audit: AuditRepository,
    ) -> None:
        self._db = db_session
        self._logs = log_repo
        self._tasks = task_repo
        self._audit = audit

    async def start(self, payload: ExecutionLogCreate) -> ExecutionLogRead:
        task = await self._tasks.get_by_id(payload.task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

        log = ExecutionLog(
            task_id=payload.task_id,
            work_session_id=payload.work_session_id,
            actual_start=payload.actual_start or datetime.datetime.now(datetime.timezone.utc),
            completed=False,
        )
        log = await self._logs.create(log)

        task.status = TaskStatus.in_progress.value
        await self._tasks.update(task)

        await self._audit.log("log.started", {"task_id": task.id, "log_id": log.id})
        await self._db.commit()
        logger.info("Execution started: task=%s log=%s", task.id, log.id)
        return ExecutionLogRead.model_validate(log)

    async def update(self, log_id: str, payload: ExecutionLogUpdate) -> ExecutionLogRead:
        log = await self._logs.get_by_id(log_id)
        if log is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")

        if payload.actual_end is not None:
            log.actual_end = payload.actual_end
        if payload.notes is not None:
            log.notes = payload.notes

        if payload.completed is True:
            log.completed = True
            if log.actual_end is None:
                log.actual_end = datetime.datetime.now(datetime.timezone.utc)

            task = await self._tasks.get_by_id(log.task_id)
            if task is not None:
                task.status = TaskStatus.done.value
                await self._tasks.update(task)

        log = await self._logs.update(log)
        await self._audit.log("log.updated", {"log_id": log_id, "completed": payload.completed})
        await self._db.commit()
        return ExecutionLogRead.model_validate(log)

    async def list(
        self,
        date: datetime.date | None,
        task_id: str | None,
    ) -> list[ExecutionLogRead]:
        logs = await self._logs.list(date=date, task_id=task_id)
        return [ExecutionLogRead.model_validate(l) for l in logs]

    async def get_active(self, task_id: str) -> ExecutionLogRead | None:
        log = await self._logs.get_active_for_task(task_id)
        if log is None:
            return None
        return ExecutionLogRead.model_validate(log)

    async def revert(self, task_id: str) -> ExecutionLogRevertRead:
        """Abandon the most recent log for this task and reset it to pending."""
        task = await self._tasks.get_by_id(task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

        previous_status = task.status

        # Find the most recent log (active or completed) to mark as abandoned
        log = await self._logs.get_last_for_task(task_id)
        log_id: str | None = None
        if log is not None and not log.abandoned:
            log.abandoned = True
            if log.actual_end is None:
                log.actual_end = datetime.datetime.now(datetime.timezone.utc)
            await self._logs.update(log)
            log_id = log.id

        task.status = TaskStatus.pending.value
        await self._tasks.update(task)

        await self._audit.log(
            "log.reverted",
            {"task_id": task_id, "previous_status": previous_status, "log_id": log_id},
        )
        await self._db.commit()
        logger.info("Task reverted to pending: task=%s previous=%s", task_id, previous_status)
        return ExecutionLogRevertRead(task_id=task_id, previous_status=previous_status, log_id=log_id)

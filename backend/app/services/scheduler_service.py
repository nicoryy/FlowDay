"""
SchedulerService — greedy priority-weighted shortest-job-first scheduler.

Algorithm:
  1. Sort tasks by (priority asc, estimated_minutes asc)
     priority 1 = highest urgency → sorts first
  2. Walk tasks; before each, insert break if minutes_since_break >= interval
  3. Tasks that don't fit before work_end → overflow
  4. Persist WorkSession + ScheduledBlocks, update task statuses

Example (work 09:00–11:00, break 5m every 50m):
  Task A priority=1 60m → block 09:00–10:00  (60m worked)
  Task B priority=1 30m → block 10:05–10:35  (break inserted at 60m, then 30m)
  Task C priority=2 90m → overflow
"""

import datetime
import logging

from fastapi import HTTPException, status

from app.models.scheduled_block import ScheduledBlock
from app.models.task import Task, TaskStatus
from app.models.user_config import UserConfig
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.audit_repository import AuditRepository
from app.repositories.schedule_repository import ScheduleRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.schedule import ScheduleResponse, ScheduledBlockRead
from app.schemas.task import TaskRead

logger = logging.getLogger(__name__)


def run_greedy(
    tasks: list[Task],
    date: datetime.date,
    work_start: datetime.time,
    work_end: datetime.time,
    break_duration_min: int,
    break_interval_min: int,
    session_id: str,
) -> tuple[list[tuple[ScheduledBlock, Task]], list[Task]]:
    """Return (scheduled_blocks_with_task, overflow_tasks)."""
    sorted_tasks = sorted(tasks, key=lambda t: (t.priority, t.estimated_minutes))

    cursor = datetime.datetime.combine(date, work_start, tzinfo=datetime.timezone.utc)
    end_dt = datetime.datetime.combine(date, work_end, tzinfo=datetime.timezone.utc)
    minutes_since_break = 0
    scheduled: list[tuple[ScheduledBlock, Task]] = []
    overflow: list[Task] = []

    for task in sorted_tasks:
        # Insert break when interval is reached
        if break_interval_min > 0 and minutes_since_break >= break_interval_min:
            cursor += datetime.timedelta(minutes=break_duration_min)
            minutes_since_break = 0

        task_end = cursor + datetime.timedelta(minutes=task.estimated_minutes)

        if task_end > end_dt:
            task.status = TaskStatus.overflow.value
            overflow.append(task)
            continue

        block = ScheduledBlock(
            task_id=task.id,
            work_session_id=session_id,
            planned_start=cursor,
            planned_end=task_end,
            position=len(scheduled),
        )
        task.status = TaskStatus.scheduled.value
        scheduled.append((block, task))
        cursor = task_end
        minutes_since_break += task.estimated_minutes

    return scheduled, overflow


class SchedulerService:
    def __init__(
        self,
        db: AsyncSession,
        task_repo: TaskRepository,
        schedule_repo: ScheduleRepository,
        audit: AuditRepository,
    ) -> None:
        self._db = db
        self._tasks = task_repo
        self._schedule = schedule_repo
        self._audit = audit

    async def generate(
        self,
        date: datetime.date,
        config: UserConfig,
        work_start: datetime.time | None,
        work_end: datetime.time | None,
    ) -> ScheduleResponse:
        if await self._schedule.get_session_by_date(date) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Schedule for {date} already exists. Delete it first.",
            )

        effective_start = work_start or config.default_work_start
        effective_end = work_end or config.default_work_end

        if effective_end <= effective_start:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="work_end must be after work_start",
            )

        pending_tasks = await self._tasks.list_pending()

        config_snapshot = {
            "work_start": effective_start.isoformat(),
            "work_end": effective_end.isoformat(),
            "break_duration_min": config.break_duration_min,
            "break_interval_min": config.break_interval_min,
        }
        work_session = await self._schedule.create_session(
            date=date,
            work_start=effective_start,
            work_end=effective_end,
            config_snapshot=config_snapshot,
        )

        scheduled, overflow = run_greedy(
            tasks=pending_tasks,
            date=date,
            work_start=effective_start,
            work_end=effective_end,
            break_duration_min=config.break_duration_min,
            break_interval_min=config.break_interval_min,
            session_id=work_session.id,
        )

        await self._schedule.create_blocks([b for b, _ in scheduled])

        for task in pending_tasks:
            await self._tasks.update(task)

        await self._db.commit()

        await self._audit.log(
            "schedule.generated",
            {"date": str(date), "blocks": len(scheduled), "overflow": len(overflow)},
        )
        await self._db.commit()
        logger.info(
            "Schedule generated for %s: %d blocks, %d overflow",
            date,
            len(scheduled),
            len(overflow),
        )

        block_reads = [
            ScheduledBlockRead(
                id=block.id,
                task_id=task.id,
                task_title=task.title,
                estimated_minutes=task.estimated_minutes,
                priority=task.priority,
                planned_start=block.planned_start,
                planned_end=block.planned_end,
                position=block.position,
            )
            for block, task in scheduled
        ]

        return ScheduleResponse(
            session_id=work_session.id,
            date=date,
            work_start=effective_start,
            work_end=effective_end,
            blocks=block_reads,
            overflow=[TaskRead.model_validate(t) for t in overflow],
        )

    async def get(self, date: datetime.date) -> ScheduleResponse:
        work_session = await self._schedule.get_session_by_date(date)
        if work_session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No schedule found for {date}",
            )

        rows = await self._schedule.get_blocks_with_tasks(work_session.id)

        block_reads = [
            ScheduledBlockRead(
                id=block.id,
                task_id=task.id,
                task_title=task.title,
                estimated_minutes=task.estimated_minutes,
                priority=task.priority,
                planned_start=block.planned_start,
                planned_end=block.planned_end,
                position=block.position,
            )
            for block, task in rows
        ]

        return ScheduleResponse(
            session_id=work_session.id,
            date=work_session.date,
            work_start=work_session.work_start,
            work_end=work_session.work_end,
            blocks=block_reads,
            overflow=[],
        )

    async def delete(self, date: datetime.date) -> None:
        work_session = await self._schedule.get_session_by_date(date)
        if work_session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No schedule found for {date}",
            )

        rows = await self._schedule.get_blocks_with_tasks(work_session.id)
        task_ids = [row[1].id for row in rows]

        await self._schedule.delete_session(work_session)
        await self._schedule.reset_tasks_to_pending(task_ids)
        await self._audit.log("schedule.deleted", {"date": str(date)})
        await self._db.commit()
        logger.info("Schedule deleted for %s", date)

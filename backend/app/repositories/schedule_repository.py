import datetime
import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scheduled_block import ScheduledBlock
from app.models.task import Task, TaskStatus
from app.models.work_session import WorkSession


class ScheduleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_session_by_date(self, date: datetime.date) -> WorkSession | None:
        result = await self._session.execute(
            select(WorkSession).where(WorkSession.date == date)
        )
        return result.scalar_one_or_none()

    async def create_session(
        self,
        date: datetime.date,
        work_start: datetime.time,
        work_end: datetime.time,
        config_snapshot: dict,  # type: ignore[type-arg]
    ) -> WorkSession:
        session = WorkSession(
            date=date,
            work_start=work_start,
            work_end=work_end,
            config_snapshot=json.dumps(config_snapshot),
        )
        self._session.add(session)
        await self._session.flush()
        return session

    async def create_blocks(self, blocks: list[ScheduledBlock]) -> list[ScheduledBlock]:
        for block in blocks:
            self._session.add(block)
        await self._session.flush()
        return blocks

    async def get_blocks_with_tasks(
        self, session_id: str
    ) -> list[tuple[ScheduledBlock, Task]]:
        result = await self._session.execute(
            select(ScheduledBlock, Task)
            .join(Task, ScheduledBlock.task_id == Task.id)
            .where(ScheduledBlock.work_session_id == session_id)
            .order_by(ScheduledBlock.position)
        )
        return list(result.all())

    async def delete_session(self, work_session: WorkSession) -> None:
        await self._session.delete(work_session)
        await self._session.flush()

    async def reset_tasks_to_pending(self, task_ids: list[str]) -> None:
        result = await self._session.execute(
            select(Task).where(Task.id.in_(task_ids))
        )
        for task in result.scalars().all():
            task.status = TaskStatus.pending.value
        await self._session.flush()

import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution_log import ExecutionLog


class LogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, log: ExecutionLog) -> ExecutionLog:
        self._session.add(log)
        await self._session.flush()
        return log

    async def get_by_id(self, log_id: str) -> ExecutionLog | None:
        result = await self._session.execute(
            select(ExecutionLog).where(ExecutionLog.id == log_id)
        )
        return result.scalar_one_or_none()

    async def get_active_for_task(self, task_id: str) -> ExecutionLog | None:
        """Return the most recent incomplete log for a task."""
        result = await self._session.execute(
            select(ExecutionLog)
            .where(ExecutionLog.task_id == task_id, ExecutionLog.completed == False)  # noqa: E712
            .order_by(ExecutionLog.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_last_for_task(self, task_id: str) -> ExecutionLog | None:
        """Return the most recent non-abandoned log for a task (active or completed)."""
        result = await self._session.execute(
            select(ExecutionLog)
            .where(ExecutionLog.task_id == task_id, ExecutionLog.abandoned == False)  # noqa: E712
            .order_by(ExecutionLog.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        date: datetime.date | None = None,
        task_id: str | None = None,
    ) -> list[ExecutionLog]:
        stmt = select(ExecutionLog).order_by(ExecutionLog.created_at.desc())
        if task_id:
            stmt = stmt.where(ExecutionLog.task_id == task_id)
        if date:
            start = datetime.datetime.combine(date, datetime.time.min, tzinfo=datetime.timezone.utc)
            end = datetime.datetime.combine(date, datetime.time.max, tzinfo=datetime.timezone.utc)
            stmt = stmt.where(ExecutionLog.created_at.between(start, end))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, log: ExecutionLog) -> ExecutionLog:
        await self._session.flush()
        return log

import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution_log import ExecutionLog
from app.models.task import Task


class StatsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_logs_with_tasks_in_range(
        self,
        date_from: datetime.datetime,
        date_to: datetime.datetime,
    ) -> list[tuple[ExecutionLog, Task]]:
        """Return (log, task) pairs for logs created within the date range."""
        result = await self._session.execute(
            select(ExecutionLog, Task)
            .join(Task, ExecutionLog.task_id == Task.id)
            .where(ExecutionLog.created_at.between(date_from, date_to))
            .order_by(ExecutionLog.created_at)
        )
        return list(result.tuples().all())

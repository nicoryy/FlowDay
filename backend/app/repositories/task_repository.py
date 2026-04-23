from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, TaskStatus


class TaskRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, task: Task) -> Task:
        self._session.add(task)
        await self._session.commit()
        await self._session.refresh(task)
        return task

    async def get_by_id(self, task_id: str) -> Task | None:
        result = await self._session.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()

    async def list(
        self,
        status: str | None = None,
        priority: int | None = None,
    ) -> list[Task]:
        stmt = select(Task).order_by(Task.priority.asc(), Task.created_at.asc())
        if status is not None:
            stmt = stmt.where(Task.status == status)
        if priority is not None:
            stmt = stmt.where(Task.priority == priority)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, task: Task) -> Task:
        await self._session.commit()
        await self._session.refresh(task)
        return task

    async def delete(self, task: Task) -> None:
        await self._session.delete(task)
        await self._session.commit()

    async def list_pending(self) -> list[Task]:
        result = await self._session.execute(
            select(Task)
            .where(Task.status == TaskStatus.pending.value)
            .order_by(Task.priority.asc(), Task.estimated_minutes.asc())
        )
        return list(result.scalars().all())

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.audit_repository import AuditRepository
from app.repositories.config_repository import ConfigRepository
from app.repositories.task_repository import TaskRepository
from app.services.task_service import TaskService


async def get_task_repo(db: AsyncSession = Depends(get_db)) -> TaskRepository:
    return TaskRepository(db)


async def get_audit_repo(db: AsyncSession = Depends(get_db)) -> AuditRepository:
    return AuditRepository(db)


async def get_config_repo(db: AsyncSession = Depends(get_db)) -> ConfigRepository:
    return ConfigRepository(db)


async def get_task_service(
    repo: TaskRepository = Depends(get_task_repo),
    audit: AuditRepository = Depends(get_audit_repo),
) -> TaskService:
    return TaskService(repo, audit)

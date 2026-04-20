from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.audit_repository import AuditRepository
from app.repositories.config_repository import ConfigRepository
from app.repositories.log_repository import LogRepository
from app.repositories.schedule_repository import ScheduleRepository
from app.repositories.task_repository import TaskRepository
from app.services.config_service import ConfigService
from app.services.log_service import LogService
from app.services.scheduler_service import SchedulerService
from app.services.task_service import TaskService


async def get_task_repo(db: AsyncSession = Depends(get_db)) -> TaskRepository:
    return TaskRepository(db)


async def get_audit_repo(db: AsyncSession = Depends(get_db)) -> AuditRepository:
    return AuditRepository(db)


async def get_config_repo(db: AsyncSession = Depends(get_db)) -> ConfigRepository:
    return ConfigRepository(db)


async def get_schedule_repo(db: AsyncSession = Depends(get_db)) -> ScheduleRepository:
    return ScheduleRepository(db)


async def get_log_repo(db: AsyncSession = Depends(get_db)) -> LogRepository:
    return LogRepository(db)


async def get_task_service(
    repo: TaskRepository = Depends(get_task_repo),
    audit: AuditRepository = Depends(get_audit_repo),
) -> TaskService:
    return TaskService(repo, audit)


async def get_scheduler_service(
    db: AsyncSession = Depends(get_db),
    task_repo: TaskRepository = Depends(get_task_repo),
    schedule_repo: ScheduleRepository = Depends(get_schedule_repo),
    audit: AuditRepository = Depends(get_audit_repo),
) -> SchedulerService:
    return SchedulerService(db, task_repo, schedule_repo, audit)


async def get_log_service(
    db: AsyncSession = Depends(get_db),
    log_repo: LogRepository = Depends(get_log_repo),
    task_repo: TaskRepository = Depends(get_task_repo),
    audit: AuditRepository = Depends(get_audit_repo),
) -> LogService:
    return LogService(db, log_repo, task_repo, audit)


async def get_config_service(
    db: AsyncSession = Depends(get_db),
    repo: ConfigRepository = Depends(get_config_repo),
) -> ConfigService:
    return ConfigService(db, repo)

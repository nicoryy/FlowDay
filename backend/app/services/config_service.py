from fastapi import HTTPException, status

from app.repositories.config_repository import ConfigRepository
from app.schemas.config import UserConfigRead, UserConfigUpdate


class ConfigService:
    def __init__(self, db_session, repo: ConfigRepository) -> None:  # type: ignore[no-untyped-def]
        self._db = db_session
        self._repo = repo

    async def get(self) -> UserConfigRead:
        config = await self._repo.get_or_create()
        return UserConfigRead.model_validate(config)

    async def update(self, payload: UserConfigUpdate) -> UserConfigRead:
        config = await self._repo.get_or_create()

        if payload.default_work_start is not None:
            config.default_work_start = payload.default_work_start
        if payload.default_work_end is not None:
            config.default_work_end = payload.default_work_end
        if payload.break_duration_min is not None:
            config.break_duration_min = payload.break_duration_min
        if payload.break_interval_min is not None:
            config.break_interval_min = payload.break_interval_min
        if payload.timezone is not None:
            config.timezone = payload.timezone
        if payload.notifications_enabled is not None:
            config.notifications_enabled = payload.notifications_enabled

        if config.default_work_end <= config.default_work_start:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="work_end must be after work_start",
            )

        config = await self._repo.update(config)
        await self._db.commit()
        return UserConfigRead.model_validate(config)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_config import UserConfig


class ConfigRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self) -> UserConfig | None:
        result = await self._session.execute(select(UserConfig).where(UserConfig.id == 1))
        return result.scalar_one_or_none()

    async def get_or_create(self) -> UserConfig:
        config = await self.get()
        if config is None:
            config = UserConfig(id=1)
            self._session.add(config)
            await self._session.commit()
            await self._session.refresh(config)
        return config

    async def update(self, config: UserConfig) -> UserConfig:
        await self._session.commit()
        await self._session.refresh(config)
        return config

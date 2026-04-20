import json
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def log(self, action: str, payload: dict[str, Any] | None = None) -> None:
        entry = AuditLog(
            action=action,
            payload=json.dumps(payload) if payload is not None else None,
        )
        self._session.add(entry)
        await self._session.flush()

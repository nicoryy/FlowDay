import uuid as _uuid

from sqlalchemy import String
from sqlalchemy.types import TypeDecorator


class UUIDType(TypeDecorator[str]):
    """String-backed UUID compatible with SQLite and Postgres."""

    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value: object, dialect: object) -> str | None:
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value: object, dialect: object) -> str | None:
        if value is None:
            return None
        return str(value)


def new_uuid() -> str:
    return str(_uuid.uuid4())

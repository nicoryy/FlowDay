import datetime

from pydantic import BaseModel, field_serializer

from app.schemas.task import TaskRead


class ScheduleRequest(BaseModel):
    date: datetime.date
    work_start: datetime.time | None = None
    work_end: datetime.time | None = None

    model_config = {
        "json_schema_extra": {
            "examples": [{"date": "2026-04-20", "work_start": "09:00", "work_end": "18:00"}]
        }
    }


class ScheduledBlockRead(BaseModel):
    id: str
    task_id: str
    task_title: str
    task_status: str
    estimated_minutes: int
    priority: int
    planned_start: datetime.datetime
    planned_end: datetime.datetime
    position: int

    model_config = {"from_attributes": True}

    @field_serializer("planned_start", "planned_end")
    def serialize_as_utc(self, dt: datetime.datetime) -> str:
        # SQLite drops tzinfo on round-trip; always emit explicit Z so frontend parses as UTC
        if dt.tzinfo is None:
            return dt.isoformat() + "Z"
        return dt.astimezone(datetime.timezone.utc).isoformat().replace("+00:00", "Z")


class ScheduleResponse(BaseModel):
    session_id: str
    date: datetime.date
    work_start: datetime.time
    work_end: datetime.time
    blocks: list[ScheduledBlockRead]
    overflow: list[TaskRead]

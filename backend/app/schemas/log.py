import datetime

from pydantic import BaseModel


class ExecutionLogCreate(BaseModel):
    task_id: str
    work_session_id: str | None = None
    actual_start: datetime.datetime | None = None


class ExecutionLogUpdate(BaseModel):
    actual_end: datetime.datetime | None = None
    completed: bool | None = None
    notes: str | None = None


class ExecutionLogRead(BaseModel):
    id: str
    task_id: str
    work_session_id: str | None
    actual_start: datetime.datetime | None
    actual_end: datetime.datetime | None
    completed: bool
    notes: str | None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}

import datetime

from pydantic import BaseModel, Field, model_validator


class UserConfigRead(BaseModel):
    id: int
    default_work_start: datetime.time
    default_work_end: datetime.time
    break_duration_min: int
    break_interval_min: int
    timezone: str
    notifications_enabled: bool

    model_config = {"from_attributes": True}


class UserConfigUpdate(BaseModel):
    default_work_start: datetime.time | None = None
    default_work_end: datetime.time | None = None
    break_duration_min: int | None = Field(default=None, ge=0, le=60)
    break_interval_min: int | None = Field(default=None, ge=10, le=120)
    timezone: str | None = None
    notifications_enabled: bool | None = None

    @model_validator(mode="after")
    def validate_window(self) -> "UserConfigUpdate":
        if self.default_work_start and self.default_work_end:
            if self.default_work_end <= self.default_work_start:
                raise ValueError("work_end must be after work_start")
        return self

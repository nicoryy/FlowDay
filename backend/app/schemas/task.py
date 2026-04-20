from datetime import datetime

from pydantic import BaseModel, Field

from app.models.task import TaskStatus


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    estimated_minutes: int = Field(..., gt=0, le=480)
    priority: int = Field(default=2, ge=1, le=3)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "Escrever relatório semanal",
                    "description": "Resumo das entregas da semana",
                    "estimated_minutes": 45,
                    "priority": 1,
                }
            ]
        }
    }


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    estimated_minutes: int | None = Field(default=None, gt=0, le=480)
    priority: int | None = Field(default=None, ge=1, le=3)
    status: TaskStatus | None = None


class TaskRead(BaseModel):
    id: str
    title: str
    description: str | None
    estimated_minutes: int
    priority: int
    status: TaskStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

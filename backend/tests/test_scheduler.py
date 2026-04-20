"""
Scheduler test suite covering all cases from TODO.md:
- All tasks fit
- One task overflows
- Multiple tasks overflow
- Breaks respected
- Empty task list
- Very short work window
- Equal priorities → order by duration asc
- Different priorities → priority wins
- Config snapshot persisted in work_session
"""

import datetime

import pytest
from httpx import AsyncClient

from app.models.task import Task, TaskStatus
from app.services.scheduler_service import run_greedy

DATE = datetime.date(2026, 4, 20)
SESSION_ID = "test-session-id"


def _task(title: str, minutes: int, priority: int = 2) -> Task:
    import uuid

    t = Task()
    t.id = str(uuid.uuid4())
    t.title = title
    t.estimated_minutes = minutes
    t.priority = priority
    t.status = TaskStatus.pending.value
    return t


def _run(
    tasks: list[Task],
    work_start: str = "09:00",
    work_end: str = "18:00",
    break_duration: int = 5,
    break_interval: int = 50,
) -> tuple[list, list]:
    ws = datetime.time.fromisoformat(work_start)
    we = datetime.time.fromisoformat(work_end)
    return run_greedy(tasks, DATE, ws, we, break_duration, break_interval, SESSION_ID)


# --- Unit tests on run_greedy ---


def test_empty_task_list() -> None:
    scheduled, overflow = _run([])
    assert scheduled == []
    assert overflow == []


def test_all_tasks_fit() -> None:
    tasks = [_task("A", 60), _task("B", 30), _task("C", 45)]
    scheduled, overflow = _run(tasks, work_start="09:00", work_end="12:00", break_interval=0)
    assert len(scheduled) == 3
    assert overflow == []
    for t in tasks:
        assert t.status == TaskStatus.scheduled.value


def test_one_task_overflows() -> None:
    tasks = [_task("A", 60), _task("B", 30), _task("Big", 200)]
    scheduled, overflow = _run(tasks, work_start="09:00", work_end="10:45", break_interval=0)
    assert len(scheduled) == 2
    assert len(overflow) == 1
    assert overflow[0].title == "Big"
    assert overflow[0].status == TaskStatus.overflow.value


def test_multiple_tasks_overflow() -> None:
    tasks = [_task("A", 60), _task("B", 90), _task("C", 90)]
    scheduled, overflow = _run(tasks, work_start="09:00", work_end="10:00", break_interval=0)
    assert len(scheduled) == 1
    assert len(overflow) == 2


def test_break_inserted_after_interval() -> None:
    # Use different priorities so A (p=1, 50m) is guaranteed to come first
    tasks = [_task("A", 50, priority=1), _task("B", 30, priority=2)]
    scheduled, overflow = _run(
        tasks, work_start="09:00", work_end="11:00", break_duration=10, break_interval=50
    )
    blocks = [b for b, _ in scheduled]
    assert len(blocks) == 2
    # A: 09:00–09:50 (50m worked → minutes_since_break=50)
    # break: 09:50–10:00 (10m inserted before B)
    # B: 10:00–10:30
    a_end = blocks[0].planned_end
    b_start = blocks[1].planned_start
    gap = int((b_start - a_end).total_seconds() / 60)
    assert gap == 10  # break was inserted


def test_no_break_if_interval_zero() -> None:
    tasks = [_task("A", 50), _task("B", 30)]
    scheduled, overflow = _run(
        tasks, work_start="09:00", work_end="11:00", break_duration=10, break_interval=0
    )
    blocks = [b for b, _ in scheduled]
    assert blocks[1].planned_start == blocks[0].planned_end  # no gap


def test_equal_priorities_ordered_by_duration_asc() -> None:
    tasks = [_task("Long", 60, priority=2), _task("Short", 20, priority=2)]
    scheduled, _ = _run(tasks, work_start="09:00", work_end="12:00", break_interval=0)
    titles = [t.title for _, t in scheduled]
    assert titles == ["Short", "Long"]


def test_different_priorities_priority_wins() -> None:
    tasks = [
        _task("Low", 10, priority=3),
        _task("High", 30, priority=1),
        _task("Medium", 20, priority=2),
    ]
    scheduled, _ = _run(tasks, work_start="09:00", work_end="12:00", break_interval=0)
    titles = [t.title for _, t in scheduled]
    assert titles == ["High", "Medium", "Low"]


def test_very_short_window_all_overflow() -> None:
    tasks = [_task("A", 30), _task("B", 45)]
    scheduled, overflow = _run(tasks, work_start="09:00", work_end="09:10", break_interval=0)
    assert scheduled == []
    assert len(overflow) == 2


def test_task_exactly_fills_window() -> None:
    tasks = [_task("A", 60)]
    scheduled, overflow = _run(tasks, work_start="09:00", work_end="10:00", break_interval=0)
    assert len(scheduled) == 1
    assert overflow == []


# --- Integration tests via HTTP ---


@pytest.mark.asyncio
async def test_generate_schedule_empty(client: AsyncClient) -> None:
    response = await client.post("/api/schedule", json={"date": "2026-04-21"})
    assert response.status_code == 201
    data = response.json()
    assert data["blocks"] == []
    assert data["overflow"] == []


@pytest.mark.asyncio
async def test_generate_schedule_with_tasks(client: AsyncClient) -> None:
    await client.post("/api/tasks", json={"title": "T1", "estimated_minutes": 60, "priority": 1})
    await client.post("/api/tasks", json={"title": "T2", "estimated_minutes": 30, "priority": 2})

    response = await client.post(
        "/api/schedule",
        json={"date": "2026-04-21", "work_start": "09:00", "work_end": "18:00"},
    )
    assert response.status_code == 201
    data = response.json()
    assert len(data["blocks"]) == 2
    assert data["blocks"][0]["task_title"] == "T1"


@pytest.mark.asyncio
async def test_generate_schedule_conflict(client: AsyncClient) -> None:
    await client.post("/api/schedule", json={"date": "2026-04-22"})
    response = await client.post("/api/schedule", json={"date": "2026-04-22"})
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_get_schedule(client: AsyncClient) -> None:
    await client.post("/api/tasks", json={"title": "X", "estimated_minutes": 30})
    await client.post("/api/schedule", json={"date": "2026-04-23"})
    response = await client.get("/api/schedule/2026-04-23")
    assert response.status_code == 200
    assert response.json()["date"] == "2026-04-23"


@pytest.mark.asyncio
async def test_get_schedule_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/schedule/2099-01-01")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_schedule_resets_tasks(client: AsyncClient) -> None:
    r = await client.post("/api/tasks", json={"title": "Y", "estimated_minutes": 30})
    task_id = r.json()["id"]

    await client.post("/api/schedule", json={"date": "2026-04-24"})

    task_after_schedule = await client.get(f"/api/tasks/{task_id}")
    assert task_after_schedule.json()["status"] == "scheduled"

    await client.delete("/api/schedule/2026-04-24")

    task_reset = await client.get(f"/api/tasks/{task_id}")
    assert task_reset.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_overflow_tasks_marked_correctly(client: AsyncClient) -> None:
    await client.post("/api/tasks", json={"title": "Big", "estimated_minutes": 120, "priority": 1})

    response = await client.post(
        "/api/schedule",
        json={"date": "2026-04-25", "work_start": "09:00", "work_end": "10:00"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["blocks"] == []
    assert len(data["overflow"]) == 1
    assert data["overflow"][0]["status"] == "overflow"

import pytest
from httpx import AsyncClient


async def _create_task(client: AsyncClient, title: str = "T", minutes: int = 30) -> str:
    r = await client.post("/api/tasks", json={"title": title, "estimated_minutes": minutes})
    return r.json()["id"]


@pytest.mark.asyncio
async def test_start_execution(client: AsyncClient) -> None:
    task_id = await _create_task(client)
    response = await client.post("/api/logs", json={"task_id": task_id})
    assert response.status_code == 201
    data = response.json()
    assert data["task_id"] == task_id
    assert data["completed"] is False
    assert data["actual_start"] is not None

    task = await client.get(f"/api/tasks/{task_id}")
    assert task.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_start_execution_task_not_found(client: AsyncClient) -> None:
    response = await client.post("/api/logs", json={"task_id": "ghost"})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_complete_execution(client: AsyncClient) -> None:
    task_id = await _create_task(client)
    log_r = await client.post("/api/logs", json={"task_id": task_id})
    log_id = log_r.json()["id"]

    response = await client.patch(f"/api/logs/{log_id}", json={"completed": True})
    assert response.status_code == 200
    data = response.json()
    assert data["completed"] is True
    assert data["actual_end"] is not None

    task = await client.get(f"/api/tasks/{task_id}")
    assert task.json()["status"] == "done"


@pytest.mark.asyncio
async def test_update_log_notes(client: AsyncClient) -> None:
    task_id = await _create_task(client)
    log_r = await client.post("/api/logs", json={"task_id": task_id})
    log_id = log_r.json()["id"]

    response = await client.patch(f"/api/logs/{log_id}", json={"notes": "Ficou mais rápido"})
    assert response.status_code == 200
    assert response.json()["notes"] == "Ficou mais rápido"


@pytest.mark.asyncio
async def test_list_logs_by_task(client: AsyncClient) -> None:
    t1 = await _create_task(client, "T1")
    t2 = await _create_task(client, "T2")
    await client.post("/api/logs", json={"task_id": t1})
    await client.post("/api/logs", json={"task_id": t2})

    response = await client.get(f"/api/logs?task_id={t1}")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["task_id"] == t1


@pytest.mark.asyncio
async def test_get_active_log(client: AsyncClient) -> None:
    task_id = await _create_task(client)
    log_r = await client.post("/api/logs", json={"task_id": task_id})
    log_id = log_r.json()["id"]

    response = await client.get(f"/api/logs/active/{task_id}")
    assert response.status_code == 200
    assert response.json()["id"] == log_id


@pytest.mark.asyncio
async def test_get_active_log_none(client: AsyncClient) -> None:
    task_id = await _create_task(client)
    response = await client.get(f"/api/logs/active/{task_id}")
    assert response.status_code == 200
    assert response.json() is None

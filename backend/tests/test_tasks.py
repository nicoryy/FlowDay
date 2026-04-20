import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient) -> None:
    response = await client.post(
        "/api/tasks",
        json={"title": "Escrever relatório", "estimated_minutes": 45, "priority": 1},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Escrever relatório"
    assert data["status"] == "pending"
    assert data["priority"] == 1
    assert "id" in data


@pytest.mark.asyncio
async def test_create_task_invalid_duration(client: AsyncClient) -> None:
    response = await client.post(
        "/api/tasks",
        json={"title": "Inválida", "estimated_minutes": 0},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_tasks_empty(client: AsyncClient) -> None:
    response = await client.get("/api/tasks")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_tasks(client: AsyncClient) -> None:
    await client.post("/api/tasks", json={"title": "T1", "estimated_minutes": 30, "priority": 2})
    await client.post("/api/tasks", json={"title": "T2", "estimated_minutes": 15, "priority": 1})

    response = await client.get("/api/tasks")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_get_task(client: AsyncClient) -> None:
    created = await client.post(
        "/api/tasks", json={"title": "Tarefa X", "estimated_minutes": 20}
    )
    task_id = created.json()["id"]

    response = await client.get(f"/api/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["id"] == task_id


@pytest.mark.asyncio
async def test_get_task_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/tasks/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_task(client: AsyncClient) -> None:
    created = await client.post(
        "/api/tasks", json={"title": "Original", "estimated_minutes": 30}
    )
    task_id = created.json()["id"]

    response = await client.patch(f"/api/tasks/{task_id}", json={"title": "Atualizado"})
    assert response.status_code == 200
    assert response.json()["title"] == "Atualizado"


@pytest.mark.asyncio
async def test_update_task_status_valid_transition(client: AsyncClient) -> None:
    created = await client.post(
        "/api/tasks", json={"title": "T", "estimated_minutes": 10}
    )
    task_id = created.json()["id"]

    response = await client.patch(f"/api/tasks/{task_id}", json={"status": "in_progress"})
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_update_task_status_invalid_transition(client: AsyncClient) -> None:
    created = await client.post(
        "/api/tasks", json={"title": "T", "estimated_minutes": 10}
    )
    task_id = created.json()["id"]

    response = await client.patch(f"/api/tasks/{task_id}", json={"status": "done"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_task(client: AsyncClient) -> None:
    created = await client.post(
        "/api/tasks", json={"title": "Para deletar", "estimated_minutes": 10}
    )
    task_id = created.json()["id"]

    response = await client.delete(f"/api/tasks/{task_id}")
    assert response.status_code == 204

    response = await client.get(f"/api/tasks/{task_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_task_not_found(client: AsyncClient) -> None:
    response = await client.delete("/api/tasks/ghost-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_filter_tasks_by_priority(client: AsyncClient) -> None:
    await client.post("/api/tasks", json={"title": "P1", "estimated_minutes": 10, "priority": 1})
    await client.post("/api/tasks", json={"title": "P2", "estimated_minutes": 10, "priority": 2})

    response = await client.get("/api/tasks?priority=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["priority"] == 1

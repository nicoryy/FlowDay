import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_config_default(client: AsyncClient) -> None:
    response = await client.get("/api/config")
    assert response.status_code == 200
    data = response.json()
    assert data["default_work_start"] == "09:00:00"
    assert data["default_work_end"] == "18:00:00"
    assert data["break_duration_min"] == 5
    assert data["break_interval_min"] == 50
    assert data["notifications_enabled"] is True


@pytest.mark.asyncio
async def test_update_config(client: AsyncClient) -> None:
    response = await client.patch(
        "/api/config",
        json={"default_work_start": "08:00:00", "default_work_end": "17:00:00"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["default_work_start"] == "08:00:00"
    assert data["default_work_end"] == "17:00:00"


@pytest.mark.asyncio
async def test_update_config_partial(client: AsyncClient) -> None:
    await client.patch("/api/config", json={"break_duration_min": 10})
    response = await client.get("/api/config")
    assert response.json()["break_duration_min"] == 10


@pytest.mark.asyncio
async def test_update_config_invalid_window(client: AsyncClient) -> None:
    response = await client.patch(
        "/api/config",
        json={"default_work_start": "18:00:00", "default_work_end": "09:00:00"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_toggle_notifications(client: AsyncClient) -> None:
    response = await client.patch("/api/config", json={"notifications_enabled": False})
    assert response.status_code == 200
    assert response.json()["notifications_enabled"] is False

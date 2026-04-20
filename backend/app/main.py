import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import async_session_factory
from app.repositories.config_repository import ConfigRepository
from app.routers import config, logs, schedule, stats, tasks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    async with async_session_factory() as session:
        repo = ConfigRepository(session)
        await repo.get_or_create()
    logger.info("FlowDay API started")
    yield
    logger.info("FlowDay API stopped")


app = FastAPI(
    title="FlowDay API",
    description="Local-first task scheduler with auto-scheduling",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(schedule.router)
app.include_router(logs.router)
app.include_router(config.router)
app.include_router(stats.router)


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}

from fastapi import APIRouter, Depends

from app.deps import get_config_service
from app.schemas.config import UserConfigRead, UserConfigUpdate
from app.services.config_service import ConfigService

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("", response_model=UserConfigRead)
async def get_config(
    service: ConfigService = Depends(get_config_service),
) -> UserConfigRead:
    return await service.get()


@router.patch("", response_model=UserConfigRead)
async def update_config(
    payload: UserConfigUpdate,
    service: ConfigService = Depends(get_config_service),
) -> UserConfigRead:
    return await service.update(payload)

"""Platform settings API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auto_emission import (
    AutoCalculationSettingRead,
    AutoCalculationSettingUpdate,
)
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["settings"])


def get_settings_service(db: Session = Depends(get_db)) -> SettingsService:
    return SettingsService(db)


@router.get("/auto-calculation", response_model=AutoCalculationSettingRead)
def get_auto_calculation_setting(
    service: SettingsService = Depends(get_settings_service),
):
    return AutoCalculationSettingRead(enabled=service.is_auto_calculation_enabled())


@router.put("/auto-calculation", response_model=AutoCalculationSettingRead)
def update_auto_calculation_setting(
    payload: AutoCalculationSettingUpdate,
    service: SettingsService = Depends(get_settings_service),
):
    enabled = service.set_auto_calculation_enabled(payload.enabled)
    service.repo.db.commit()
    return AutoCalculationSettingRead(enabled=enabled)

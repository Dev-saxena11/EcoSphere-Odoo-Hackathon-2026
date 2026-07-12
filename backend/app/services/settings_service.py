"""Business logic for platform settings (typed access over the key/value store)."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.app_setting import AUTO_CALCULATION_ENABLED
from app.repositories.app_setting_repository import AppSettingRepository

_TRUE = "true"
_FALSE = "false"


class SettingsService:
    def __init__(self, db: Session):
        self.repo = AppSettingRepository(db)

    def is_auto_calculation_enabled(self) -> bool:
        setting = self.repo.get(AUTO_CALCULATION_ENABLED)
        # Auto-calculation is opt-in: defaults to off until explicitly enabled.
        return setting is not None and setting.value == _TRUE

    def set_auto_calculation_enabled(self, enabled: bool) -> bool:
        self.repo.set(AUTO_CALCULATION_ENABLED, _TRUE if enabled else _FALSE)
        return enabled

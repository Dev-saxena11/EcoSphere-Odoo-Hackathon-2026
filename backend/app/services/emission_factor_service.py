"""Business logic for EmissionFactor CRUD and deactivation."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.emission_factor import ActivityType, EmissionFactor, FactorStatus
from app.repositories.emission_factor_repository import EmissionFactorRepository
from app.schemas.emission_factor import EmissionFactorCreate, EmissionFactorUpdate


class EmissionFactorError(Exception):
    pass


class EmissionFactorNotFoundError(EmissionFactorError):
    pass


class EmissionFactorValidationError(EmissionFactorError):
    pass


class EmissionFactorInUseError(EmissionFactorError):
    pass


class EmissionFactorService:
    def __init__(self, db: Session):
        self.repo = EmissionFactorRepository(db)

    def list_factors(
        self,
        *,
        activity_type: Optional[ActivityType] = None,
        status: Optional[FactorStatus] = None,
    ) -> list[EmissionFactor]:
        return self.repo.list(activity_type=activity_type, status=status)

    def get_factor(self, factor_id: int) -> EmissionFactor:
        factor = self.repo.get(factor_id)
        if factor is None:
            raise EmissionFactorNotFoundError(f"Emission factor {factor_id} not found")
        return factor

    def create_factor(self, payload: EmissionFactorCreate) -> EmissionFactor:
        factor = EmissionFactor(
            factor_code=payload.factor_code,
            name=payload.name,
            activity_type=payload.activity_type,
            unit=payload.unit,
            co2e_per_unit=payload.co2e_per_unit,
            source=payload.source,
            effective_start=payload.effective_start,
            status=FactorStatus.ACTIVE,
        )
        return self.repo.create(factor)

    def update_factor(self, factor_id: int, payload: EmissionFactorUpdate) -> EmissionFactor:
        factor = self.get_factor(factor_id)
        update_data = payload.model_dump(exclude_unset=True)

        for field in (
            "name",
            "activity_type",
            "unit",
            "co2e_per_unit",
            "source",
            "effective_start",
            "effective_end",
            "status",
        ):
            if field in update_data:
                setattr(factor, field, update_data[field])

        self._ensure_valid_period(factor.effective_start, factor.effective_end)
        self.repo.db.flush()
        return factor

    def deactivate_factor(self, factor_id: int) -> EmissionFactor:
        factor = self.get_factor(factor_id)
        factor.status = FactorStatus.INACTIVE
        self.repo.db.flush()
        return factor

    def reactivate_factor(self, factor_id: int) -> EmissionFactor:
        factor = self.get_factor(factor_id)
        factor.status = FactorStatus.ACTIVE
        self.repo.db.flush()
        return factor

    def delete_factor(self, factor_id: int) -> None:
        factor = self.get_factor(factor_id)
        if self.repo.is_referenced(factor_id):
            raise EmissionFactorInUseError(
                f"Emission factor {factor_id} is referenced by existing carbon "
                "transactions and cannot be deleted; deactivate it instead"
            )
        self.repo.delete(factor)

    @staticmethod
    def _ensure_valid_period(effective_start, effective_end) -> None:
        if effective_end is not None and effective_end < effective_start:
            raise EmissionFactorValidationError(
                "effective_end must be greater than or equal to effective_start"
            )

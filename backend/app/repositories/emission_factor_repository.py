"""Data access helpers for EmissionFactor records."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.carbon_transaction import CarbonTransaction
from app.models.emission_factor import ActivityType, EmissionFactor, FactorStatus


class EmissionFactorRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(
        self,
        *,
        activity_type: Optional[ActivityType] = None,
        status: Optional[FactorStatus] = None,
    ) -> list[EmissionFactor]:
        query = self.db.query(EmissionFactor)
        if activity_type is not None:
            query = query.filter(EmissionFactor.activity_type == activity_type)
        if status is not None:
            query = query.filter(EmissionFactor.status == status)
        return query.order_by(
            EmissionFactor.factor_code.asc(), EmissionFactor.effective_start.desc()
        ).all()

    def get(self, factor_id: int) -> Optional[EmissionFactor]:
        return self.db.get(EmissionFactor, factor_id)

    def create(self, factor: EmissionFactor) -> EmissionFactor:
        self.db.add(factor)
        self.db.flush()
        return factor

    def delete(self, factor: EmissionFactor) -> None:
        self.db.delete(factor)

    def is_referenced(self, factor_id: int) -> bool:
        return (
            self.db.query(CarbonTransaction.id)
            .filter(CarbonTransaction.emission_factor_id == factor_id)
            .first()
            is not None
        )

"""Pydantic v2 schemas for carbon analytics endpoints (issue #11)."""
from __future__ import annotations

from pydantic import BaseModel

from app.models.carbon_transaction import SourceType


class MonthlyEmissionPoint(BaseModel):
    """One data point in the emissions-over-time trend."""

    month: str  # e.g. "Jan"
    month_num: int  # 1-12
    year: int
    total_co2e: float
    transaction_count: int


class SourceBreakdownItem(BaseModel):
    """Emissions aggregated by source type."""

    source_type: SourceType
    total_co2e: float
    transaction_count: int

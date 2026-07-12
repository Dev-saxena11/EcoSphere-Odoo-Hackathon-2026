"""Carbon analytics API routes (issue #11 — Environmental Dashboard)."""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.carbon_transaction import CarbonTransaction, SourceType, TransactionStatus
from app.models.department import Department
from app.schemas.carbon_analytics import MonthlyEmissionPoint, SourceBreakdownItem

router = APIRouter(prefix="/carbon-analytics", tags=["carbon-analytics"])

_MONTH_ABBREVS = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


@router.get("/emissions-trend", response_model=list[MonthlyEmissionPoint])
def emissions_trend(
    year: Optional[int] = Query(default=None, description="Year to fetch trend for. Defaults to current year."),
    db: Session = Depends(get_db),
):
    """Monthly emissions trend for a given year (or current year).

    Returns 12 data points — one per month — even when a month has zero
    transactions (total_co2e = 0, transaction_count = 0).
    """
    target_year = year or datetime.now().year

    rows = (
        db.query(
            extract("month", CarbonTransaction.transaction_date).label("month_num"),
            func.count(CarbonTransaction.id).label("tx_count"),
            func.coalesce(func.sum(CarbonTransaction.co2e), 0.0).label("total"),
        )
        .filter(
            extract("year", CarbonTransaction.transaction_date) == target_year,
            CarbonTransaction.status == TransactionStatus.CONFIRMED,
        )
        .group_by(extract("month", CarbonTransaction.transaction_date))
        .all()
    )

    month_map = {int(r.month_num): (r.tx_count, float(r.total)) for r in rows}

    return [
        MonthlyEmissionPoint(
            month=_MONTH_ABBREVS[m],
            month_num=m,
            year=target_year,
            transaction_count=month_map.get(m, (0, 0.0))[0],
            total_co2e=round(month_map.get(m, (0, 0.0))[1], 2),
        )
        for m in range(1, 13)
    ]


@router.get("/source-breakdown", response_model=list[SourceBreakdownItem])
def source_breakdown(
    year: Optional[int] = Query(default=None),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
):
    """Emissions aggregated by source type for the pie chart."""
    query = (
        db.query(
            CarbonTransaction.source_type,
            func.count(CarbonTransaction.id).label("tx_count"),
            func.coalesce(func.sum(CarbonTransaction.co2e), 0.0).label("total"),
        )
        .filter(CarbonTransaction.status == TransactionStatus.CONFIRMED)
    )
    if year is not None:
        query = query.filter(
            extract("year", CarbonTransaction.transaction_date) == year
        )
    if date_from is not None:
        query = query.filter(CarbonTransaction.transaction_date >= date_from)
    if date_to is not None:
        query = query.filter(CarbonTransaction.transaction_date <= date_to)

    rows = (
        query.group_by(CarbonTransaction.source_type)
        .order_by(func.coalesce(func.sum(CarbonTransaction.co2e), 0.0).desc())
        .all()
    )

    return [
        SourceBreakdownItem(
            source_type=r.source_type,
            transaction_count=r.tx_count,
            total_co2e=round(float(r.total), 2),
        )
        for r in rows
    ]

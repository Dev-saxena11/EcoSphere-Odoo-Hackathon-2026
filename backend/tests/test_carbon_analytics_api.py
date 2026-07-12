"""Tests for the carbon analytics endpoints (issue #11)."""
from __future__ import annotations

from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.carbon_transaction import CarbonTransaction, SourceType, TransactionStatus
from app.models.department import Department
from app.models.emission_factor import ActivityType, EmissionFactor


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, future=True)()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture()
def seeded(db):
    eng = Department(name="Engineering", code="ENG", employee_count=5)
    db.add(eng)
    db.commit()

    factor = EmissionFactor.new_version(
        db, factor_code="fuel.diesel", name="Diesel", activity_type=ActivityType.FUEL,
        unit="litre", co2e_per_unit=2.0, effective_start=date(2025, 1, 1),
    )

    # 2026 data
    t1 = CarbonTransaction.record_auto(
        db, source_type=SourceType.FLEET, quantity=100, transaction_date=date(2026, 1, 15),
        emission_factor=factor,
    )
    t1.department_id = eng.id
    t1.status = TransactionStatus.CONFIRMED

    t2 = CarbonTransaction.record_auto(
        db, source_type=SourceType.EXPENSE, quantity=50, transaction_date=date(2026, 5, 20),
        emission_factor=factor,
    )
    t2.department_id = eng.id
    t2.status = TransactionStatus.CONFIRMED

    # Unconfirmed transaction (should be excluded)
    t3 = CarbonTransaction.record_auto(
        db, source_type=SourceType.FLEET, quantity=200, transaction_date=date(2026, 5, 25),
        emission_factor=factor,
    )
    t3.department_id = eng.id
    t3.status = TransactionStatus.DRAFT

    # 2025 data (previous year comparison data)
    t4 = CarbonTransaction.record_auto(
        db, source_type=SourceType.PURCHASE, quantity=80, transaction_date=date(2025, 5, 10),
        emission_factor=factor,
    )
    t4.department_id = eng.id
    t4.status = TransactionStatus.CONFIRMED

    db.commit()
    return {"eng": eng}


def test_emissions_trend_success(client, seeded):
    # Fetch trend for year 2026
    response = client.get("/api/v1/carbon-analytics/emissions-trend", params={"year": 2026})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 12

    # Check Jan (month_num=1): t1 (quantity=100 * 2.0 = 200 CO2e)
    jan = next(x for x in data if x["month_num"] == 1)
    assert jan["total_co2e"] == pytest.approx(200.0)
    assert jan["transaction_count"] == 1

    # Check May (month_num=5): t2 (quantity=50 * 2.0 = 100 CO2e). t3 is draft, so excluded.
    may = next(x for x in data if x["month_num"] == 5)
    assert may["total_co2e"] == pytest.approx(100.0)
    assert may["transaction_count"] == 1

    # Check rest is 0
    feb = next(x for x in data if x["month_num"] == 2)
    assert feb["total_co2e"] == 0.0
    assert feb["transaction_count"] == 0


def test_emissions_trend_default_year(client, seeded):
    # Should default to current year
    response = client.get("/api/v1/carbon-analytics/emissions-trend")
    assert response.status_code == 200
    assert len(response.json()) == 12


def test_source_breakdown_success(client, seeded):
    response = client.get("/api/v1/carbon-analytics/source-breakdown", params={"year": 2026})
    assert response.status_code == 200
    data = response.json()

    # The confirmed 2026 txs are FLEET (200.0 co2e) and EXPENSE (100.0 co2e)
    assert len(data) == 2
    fleet = next(x for x in data if x["source_type"] == "fleet")
    assert fleet["total_co2e"] == pytest.approx(200.0)
    assert fleet["transaction_count"] == 1

    expense = next(x for x in data if x["source_type"] == "expense")
    assert expense["total_co2e"] == pytest.approx(100.0)
    assert expense["transaction_count"] == 1


def test_source_breakdown_filters(client, seeded):
    response = client.get(
        "/api/v1/carbon-analytics/source-breakdown",
        params={"date_from": "2025-01-01", "date_to": "2025-12-31"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    purchase = data[0]
    assert purchase["source_type"] == "purchase"
    assert purchase["total_co2e"] == pytest.approx(160.0)  # 80 * 2.0

"""Tests for manual Carbon Transaction entry (issue #6 acceptance criteria)."""
from __future__ import annotations

from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.department import Department
from app.models.emission_factor import ActivityType, EmissionFactor, FactorStatus


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
def master_data(db):
    department = Department(name="Operations", code="OPS", employee_count=10)
    factor = EmissionFactor.new_version(
        db,
        factor_code="fuel.diesel",
        name="Diesel",
        activity_type=ActivityType.FUEL,
        unit="litre",
        co2e_per_unit=2.68,
        effective_start=date(2026, 1, 1),
    )
    db.add(department)
    db.commit()
    return {"department": department, "factor": factor}


def test_manual_entry_computes_co2e_and_persists(client, master_data):
    department = master_data["department"]
    factor = master_data["factor"]

    response = client.post(
        "/api/v1/carbon-transactions",
        json={
            "department_id": department.id,
            "source_type": "fleet",
            "emission_factor_id": factor.id,
            "quantity": 100,
            "transaction_date": "2026-06-01",
            "notes": "Manual log for delivery van",
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["co2e"] == pytest.approx(268.0)
    assert payload["created_by"] == "manual"
    assert payload["status"] == "confirmed"
    assert payload["factor_value"] == pytest.approx(2.68)

    response = client.get("/api/v1/carbon-transactions", params={"department_id": department.id})
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_manual_entry_rejects_non_positive_quantity(client, master_data):
    factor = master_data["factor"]
    response = client.post(
        "/api/v1/carbon-transactions",
        json={
            "source_type": "fleet",
            "emission_factor_id": factor.id,
            "quantity": 0,
            "transaction_date": "2026-06-01",
        },
    )
    assert response.status_code == 422

    response = client.post(
        "/api/v1/carbon-transactions",
        json={
            "source_type": "fleet",
            "emission_factor_id": factor.id,
            "quantity": -5,
            "transaction_date": "2026-06-01",
        },
    )
    assert response.status_code == 422


def test_manual_entry_rejects_inactive_factor(client, db, master_data):
    factor = master_data["factor"]
    factor.status = FactorStatus.INACTIVE
    db.commit()

    response = client.post(
        "/api/v1/carbon-transactions",
        json={
            "source_type": "fleet",
            "emission_factor_id": factor.id,
            "quantity": 10,
            "transaction_date": "2026-06-01",
        },
    )
    assert response.status_code == 400
    assert "not active" in response.json()["detail"]


def test_manual_entry_rejects_factor_not_yet_effective(client, master_data):
    factor = master_data["factor"]
    response = client.post(
        "/api/v1/carbon-transactions",
        json={
            "source_type": "fleet",
            "emission_factor_id": factor.id,
            "quantity": 10,
            # Before the factor's effective_start of 2026-01-01.
            "transaction_date": "2025-06-01",
        },
    )
    assert response.status_code == 400
    assert "not active" in response.json()["detail"]


def test_manual_entry_rejects_unknown_department(client, master_data):
    factor = master_data["factor"]
    response = client.post(
        "/api/v1/carbon-transactions",
        json={
            "department_id": 9999,
            "source_type": "fleet",
            "emission_factor_id": factor.id,
            "quantity": 10,
            "transaction_date": "2026-06-01",
        },
    )
    assert response.status_code == 400
    assert "Department" in response.json()["detail"]


def test_manual_entry_rejects_unknown_emission_factor(client, master_data):
    response = client.post(
        "/api/v1/carbon-transactions",
        json={
            "source_type": "fleet",
            "emission_factor_id": 9999,
            "quantity": 10,
            "transaction_date": "2026-06-01",
        },
    )
    assert response.status_code == 400
    assert "not found" in response.json()["detail"]

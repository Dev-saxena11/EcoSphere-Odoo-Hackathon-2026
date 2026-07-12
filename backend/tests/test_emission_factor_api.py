"""Tests for the EmissionFactor CRUD API and deactivation rules (issue #5)."""
from __future__ import annotations

from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.carbon_transaction import CarbonTransaction, SourceType
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


def test_create_list_update_deactivate_emission_factor_via_api(client):
    response = client.post(
        "/api/v1/emission-factors",
        json={
            "factor_code": "fuel.petrol",
            "name": "Petrol",
            "activity_type": "fuel",
            "unit": "litre",
            "co2e_per_unit": 2.31,
            "source": "DEFRA 2026",
            "effective_start": "2026-01-01",
        },
    )
    assert response.status_code == 201
    payload = response.json()
    factor_id = payload["id"]
    assert payload["status"] == "active"

    response = client.get(
        "/api/v1/emission-factors", params={"activity_type": "fuel", "status": "active"}
    )
    assert response.status_code == 200
    assert [f["factor_code"] for f in response.json()] == ["fuel.petrol"]

    response = client.put(
        f"/api/v1/emission-factors/{factor_id}",
        json={"co2e_per_unit": 2.4},
    )
    assert response.status_code == 200
    assert response.json()["co2e_per_unit"] == 2.4

    response = client.post(f"/api/v1/emission-factors/{factor_id}/deactivate")
    assert response.status_code == 200
    assert response.json()["status"] == "inactive"

    # Deactivated factors are hidden from active-only listings...
    response = client.get("/api/v1/emission-factors", params={"status": "active"})
    assert response.json() == []

    # ...but remain retrievable directly (e.g. for historical transaction display).
    response = client.get(f"/api/v1/emission-factors/{factor_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "inactive"

    response = client.post(f"/api/v1/emission-factors/{factor_id}/reactivate")
    assert response.status_code == 200
    assert response.json()["status"] == "active"


def test_delete_blocked_when_referenced_by_carbon_transaction(client, db):
    factor = EmissionFactor.new_version(
        db,
        factor_code="grid.electricity.in",
        name="India grid electricity",
        activity_type=ActivityType.ELECTRICITY,
        unit="kWh",
        co2e_per_unit=0.82,
        effective_start=date(2026, 1, 1),
    )
    db.commit()

    CarbonTransaction.record_auto(
        db,
        source_type=SourceType.PURCHASE,
        quantity=100,
        transaction_date=date(2026, 6, 1),
        emission_factor=factor,
    )
    db.commit()

    response = client.delete(f"/api/v1/emission-factors/{factor.id}")
    assert response.status_code == 409

    # Deactivating instead succeeds.
    response = client.post(f"/api/v1/emission-factors/{factor.id}/deactivate")
    assert response.status_code == 200
    assert response.json()["status"] == "inactive"


def test_delete_allowed_when_not_referenced(client):
    response = client.post(
        "/api/v1/emission-factors",
        json={
            "factor_code": "waste.landfill",
            "name": "Landfill waste",
            "activity_type": "waste",
            "unit": "kg",
            "co2e_per_unit": 0.5,
            "effective_start": "2026-01-01",
        },
    )
    factor_id = response.json()["id"]

    response = client.delete(f"/api/v1/emission-factors/{factor_id}")
    assert response.status_code == 204

    response = client.get(f"/api/v1/emission-factors/{factor_id}")
    assert response.status_code == 404


def test_update_rejects_invalid_effective_period(client):
    response = client.post(
        "/api/v1/emission-factors",
        json={
            "factor_code": "travel.rail",
            "name": "Rail travel",
            "activity_type": "travel",
            "unit": "km",
            "co2e_per_unit": 0.04,
            "effective_start": "2026-01-01",
        },
    )
    factor_id = response.json()["id"]

    response = client.put(
        f"/api/v1/emission-factors/{factor_id}",
        json={"effective_end": "2025-12-31"},
    )
    assert response.status_code == 400

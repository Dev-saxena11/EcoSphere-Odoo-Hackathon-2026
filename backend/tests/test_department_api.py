"""Tests for the read-only Department listing endpoint."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.department import Department


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


def test_list_departments_sorted_by_name(client, db):
    db.add_all(
        [
            Department(name="Sales", code="SAL", employee_count=5),
            Department(name="Engineering", code="ENG", employee_count=10),
        ]
    )
    db.commit()

    response = client.get("/api/v1/departments")
    assert response.status_code == 200
    assert [d["name"] for d in response.json()] == ["Engineering", "Sales"]

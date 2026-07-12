"""Pydantic v2 schemas for the Department resource."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.models.department import DeptStatus


class DepartmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str | None
    employee_count: int
    status: DeptStatus

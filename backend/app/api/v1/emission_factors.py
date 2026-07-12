"""EmissionFactor API routes."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.emission_factor import ActivityType, FactorStatus
from app.schemas.emission_factor import (
    EmissionFactorCreate,
    EmissionFactorRead,
    EmissionFactorUpdate,
)
from app.services.emission_factor_service import (
    EmissionFactorInUseError,
    EmissionFactorNotFoundError,
    EmissionFactorService,
    EmissionFactorValidationError,
)

router = APIRouter(prefix="/emission-factors", tags=["emission-factors"])


def get_emission_factor_service(db: Session = Depends(get_db)) -> EmissionFactorService:
    return EmissionFactorService(db)


@router.get("", response_model=list[EmissionFactorRead])
def list_emission_factors(
    activity_type: Optional[ActivityType] = None,
    status_filter: Optional[FactorStatus] = Query(default=None, alias="status"),
    service: EmissionFactorService = Depends(get_emission_factor_service),
):
    return service.list_factors(activity_type=activity_type, status=status_filter)


@router.get("/{factor_id}", response_model=EmissionFactorRead)
def get_emission_factor(
    factor_id: int,
    service: EmissionFactorService = Depends(get_emission_factor_service),
):
    try:
        return service.get_factor(factor_id)
    except EmissionFactorNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("", response_model=EmissionFactorRead, status_code=status.HTTP_201_CREATED)
def create_emission_factor(
    payload: EmissionFactorCreate,
    service: EmissionFactorService = Depends(get_emission_factor_service),
):
    factor = service.create_factor(payload)
    service.repo.db.commit()
    return factor


@router.put("/{factor_id}", response_model=EmissionFactorRead)
def update_emission_factor(
    factor_id: int,
    payload: EmissionFactorUpdate,
    service: EmissionFactorService = Depends(get_emission_factor_service),
):
    try:
        factor = service.update_factor(factor_id, payload)
        service.repo.db.commit()
        return factor
    except EmissionFactorNotFoundError as exc:
        service.repo.db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except EmissionFactorValidationError as exc:
        service.repo.db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{factor_id}/deactivate", response_model=EmissionFactorRead)
def deactivate_emission_factor(
    factor_id: int,
    service: EmissionFactorService = Depends(get_emission_factor_service),
):
    try:
        factor = service.deactivate_factor(factor_id)
        service.repo.db.commit()
        return factor
    except EmissionFactorNotFoundError as exc:
        service.repo.db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{factor_id}/reactivate", response_model=EmissionFactorRead)
def reactivate_emission_factor(
    factor_id: int,
    service: EmissionFactorService = Depends(get_emission_factor_service),
):
    try:
        factor = service.reactivate_factor(factor_id)
        service.repo.db.commit()
        return factor
    except EmissionFactorNotFoundError as exc:
        service.repo.db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{factor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emission_factor(
    factor_id: int,
    service: EmissionFactorService = Depends(get_emission_factor_service),
):
    try:
        service.delete_factor(factor_id)
        service.repo.db.commit()
    except EmissionFactorNotFoundError as exc:
        service.repo.db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except EmissionFactorInUseError as exc:
        service.repo.db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

"""Data access helpers for CarbonTransaction records."""
from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app.models.carbon_transaction import CarbonTransaction, SourceType, TransactionStatus


class CarbonTransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(
        self,
        *,
        department_id: Optional[int] = None,
        source_type: Optional[SourceType] = None,
        status: Optional[TransactionStatus] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> list[CarbonTransaction]:
        query = self.db.query(CarbonTransaction)
        if department_id is not None:
            query = query.filter(CarbonTransaction.department_id == department_id)
        if source_type is not None:
            query = query.filter(CarbonTransaction.source_type == source_type)
        if status is not None:
            query = query.filter(CarbonTransaction.status == status)
        if date_from is not None:
            query = query.filter(CarbonTransaction.transaction_date >= date_from)
        if date_to is not None:
            query = query.filter(CarbonTransaction.transaction_date <= date_to)
        return query.order_by(
            CarbonTransaction.transaction_date.desc(), CarbonTransaction.id.desc()
        ).all()

    def get(self, transaction_id: int) -> Optional[CarbonTransaction]:
        return self.db.get(CarbonTransaction, transaction_id)

    def create(self, transaction: CarbonTransaction) -> CarbonTransaction:
        self.db.add(transaction)
        self.db.flush()
        return transaction

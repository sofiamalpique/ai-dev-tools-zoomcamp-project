from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Category, Label, Transaction
from app.schemas import (
    CategoryOut,
    LabelCreate,
    LabelOut,
    TransactionCreate,
    TransactionOut,
)

router = APIRouter()


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    categories = db.execute(select(Category).order_by(Category.key)).scalars().all()
    return categories


@router.get("/labels", response_model=list[LabelOut])
def list_labels(db: Session = Depends(get_db)) -> list[LabelOut]:
    labels = db.execute(select(Label).order_by(Label.label)).scalars().all()
    return labels


@router.post(
    "/labels",
    response_model=LabelOut,
    status_code=status.HTTP_201_CREATED,
)
def create_label(
    payload: LabelCreate,
    db: Session = Depends(get_db),
) -> LabelOut:
    category = db.get(Category, payload.category_id)
    if category is None:
        raise HTTPException(status_code=400, detail="Category not found")
    existing = db.execute(
        select(Label).where(Label.label == payload.label)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Label already exists")
    label = Label(label=payload.label, category_id=payload.category_id)
    db.add(label)
    db.commit()
    db.refresh(label)
    return label


@router.get("/transactions", response_model=list[TransactionOut])
def list_transactions(db: Session = Depends(get_db)) -> list[TransactionOut]:
    transactions = (
        db.execute(select(Transaction).order_by(Transaction.occurred_at.desc()))
        .scalars()
        .all()
    )
    return transactions


@router.post(
    "/transactions",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
) -> TransactionOut:
    label = db.get(Label, payload.label_id)
    if label is None:
        raise HTTPException(status_code=400, detail="Label not found")
    transaction = Transaction(
        amount=payload.amount,
        occurred_at=payload.occurred_at,
        description=payload.description,
        label_id=payload.label_id,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

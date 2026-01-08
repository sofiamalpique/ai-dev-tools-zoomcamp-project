from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Category, Transaction
from app.schemas import CategoryCreate, CategoryOut, TransactionCreate, TransactionOut

router = APIRouter()


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    categories = db.execute(select(Category).order_by(Category.name)).scalars().all()
    return categories


@router.post(
    "/categories",
    response_model=CategoryOut,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
) -> CategoryOut:
    existing = db.execute(
        select(Category).where(Category.name == payload.name)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Category name already exists")
    category = Category(name=payload.name, kind=payload.kind)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


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
    category = db.get(Category, payload.category_id)
    if category is None:
        raise HTTPException(status_code=400, detail="Category not found")
    transaction = Transaction(
        amount=payload.amount,
        occurred_at=payload.occurred_at,
        description=payload.description,
        category_id=payload.category_id,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

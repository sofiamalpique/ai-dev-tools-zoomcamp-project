from datetime import date
from decimal import Decimal, ROUND_HALF_UP

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Category, Label, Transaction
from app.schemas import (
    CategoryOut,
    LabelCreate,
    LabelOut,
    TransactionCreate,
    TransactionOut,
    WeeklyReviewOut,
    WeeklyReviewSuggestionOut,
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


def _format_amount(value: Decimal | None) -> str:
    amount = value or Decimal("0")
    return str(amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _weekly_review_summary(
    db: Session,
    start_date: date,
    end_date: date,
) -> WeeklyReviewOut:
    if start_date > end_date:
        raise HTTPException(
            status_code=422,
            detail="start_date must be on or before end_date",
        )

    total_by_category = (
        select(
            Category.key.label("category_key"),
            func.sum(Transaction.amount).label("total_amount"),
        )
        .join(Label, Label.category_id == Category.id)
        .join(Transaction, Transaction.label_id == Label.id)
        .where(Transaction.occurred_at >= start_date)
        .where(Transaction.occurred_at <= end_date)
        .group_by(Category.key)
        .order_by(desc(func.sum(Transaction.amount)))
    )

    rows = db.execute(total_by_category).all()
    total_amount = sum((row.total_amount or Decimal("0")) for row in rows)

    return WeeklyReviewOut(
        start_date=start_date,
        end_date=end_date,
        total_amount=_format_amount(total_amount),
        by_category=[
            {
                "category_key": row.category_key,
                "total_amount": _format_amount(row.total_amount),
            }
            for row in rows
        ],
    )


def _weekly_review_prompt(summary: WeeklyReviewOut) -> str:
    lines = [f"Total: {summary.total_amount}"]
    for entry in summary.by_category:
        lines.append(f"{entry.category_key}: {entry.total_amount}")
    return "Weekly totals:\\n" + "\\n".join(lines)


def fetch_weekly_suggestion(summary: WeeklyReviewOut) -> str:
    payload = {"input": _weekly_review_prompt(summary)}
    urls = [
        "http://localhost:8001/suggest-weekly-review",
        "http://mcp_server:8001/suggest-weekly-review",
    ]
    last_error: Exception | None = None

    for url in urls:
        try:
            response = httpx.post(url, json=payload, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            suggestion = data.get("suggestion") if isinstance(data, dict) else None
            if not suggestion:
                raise HTTPException(
                    status_code=502,
                    detail="MCP response missing suggestion",
                )
            return suggestion
        except httpx.RequestError as exc:
            last_error = exc
            continue
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=502,
                detail="MCP server error",
            ) from exc

    raise HTTPException(
        status_code=502,
        detail="MCP server unavailable",
    ) from last_error


@router.get("/reviews/weekly", response_model=WeeklyReviewOut)
def weekly_review(
    start_date: date = Query(..., description="YYYY-MM-DD"),
    end_date: date = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
) -> WeeklyReviewOut:
    return _weekly_review_summary(db, start_date, end_date)


@router.get("/reviews/weekly/suggestion", response_model=WeeklyReviewSuggestionOut)
def weekly_review_suggestion(
    start_date: date = Query(..., description="YYYY-MM-DD"),
    end_date: date = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
) -> WeeklyReviewSuggestionOut:
    summary = _weekly_review_summary(db, start_date, end_date)
    suggestion = fetch_weekly_suggestion(summary)
    return WeeklyReviewSuggestionOut(
        start_date=start_date,
        end_date=end_date,
        summary=summary,
        suggestion=suggestion,
    )

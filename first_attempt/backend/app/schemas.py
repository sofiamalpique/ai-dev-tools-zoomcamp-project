from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CategoryOut(BaseModel):
    id: UUID
    key: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LabelBase(BaseModel):
    label: str
    category_id: UUID


class LabelCreate(LabelBase):
    pass


class LabelOut(LabelBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionBase(BaseModel):
    amount: Decimal
    occurred_at: datetime
    description: str | None = None
    label_id: UUID


class TransactionCreate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WeeklyReviewCategoryOut(BaseModel):
    category_key: str
    total_amount: str


class WeeklyReviewOut(BaseModel):
    start_date: date
    end_date: date
    total_amount: str
    by_category: list[WeeklyReviewCategoryOut]


class WeeklyReviewSuggestionOut(BaseModel):
    start_date: date
    end_date: date
    summary: WeeklyReviewOut
    suggestion: str

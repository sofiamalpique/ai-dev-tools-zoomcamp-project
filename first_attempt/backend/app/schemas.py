from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


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
    occurred_at: date
    description: str | None = None
    label_id: UUID


class TransactionCreate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HabitCreate(BaseModel):
    name: str
    start_date: date
    end_date: date | None = None
    interval: int = Field(1, ge=1)
    unit: Literal["day", "week", "month"] = "day"

    @model_validator(mode="after")
    def validate_dates(self) -> "HabitCreate":
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class HabitOut(BaseModel):
    id: UUID
    name: str
    start_date: date
    end_date: date | None
    interval: int
    unit: Literal["day", "week", "month"]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HabitCompletionsOut(BaseModel):
    date: date
    completed_habit_ids: list[UUID]


class HabitToggleIn(BaseModel):
    date: date


class HabitToggleOut(BaseModel):
    status: str


class HabitForDateOut(BaseModel):
    id: UUID
    name: str
    start_date: date
    end_date: date | None
    interval: int
    unit: Literal["day", "week", "month"]
    checked: bool


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

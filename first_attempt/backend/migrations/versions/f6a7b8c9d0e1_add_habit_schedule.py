"""Add schedule fields to habits.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2025-01-08 20:00:00

"""
from alembic import op
import sqlalchemy as sa

revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("habits", sa.Column("start_date", sa.Date(), nullable=True))
    op.add_column("habits", sa.Column("end_date", sa.Date(), nullable=True))
    op.add_column("habits", sa.Column("interval", sa.Integer(), nullable=True))
    op.add_column("habits", sa.Column("unit", sa.Text(), nullable=True))

    op.execute(
        """
        UPDATE habits
        SET start_date = COALESCE(created_at::date, CURRENT_DATE),
            end_date = NULL,
            interval = 1,
            unit = 'day'
        """
    )

    op.alter_column("habits", "start_date", nullable=False)
    op.alter_column("habits", "interval", nullable=False)
    op.alter_column("habits", "unit", nullable=False)

    op.create_check_constraint(
        "ck_habits_interval_positive",
        "habits",
        "interval >= 1",
    )
    op.create_check_constraint(
        "ck_habits_unit_allowed",
        "habits",
        "unit IN ('day','week','month')",
    )
    op.create_check_constraint(
        "ck_habits_end_date_after_start",
        "habits",
        "end_date IS NULL OR end_date >= start_date",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_habits_end_date_after_start",
        "habits",
        type_="check",
    )
    op.drop_constraint(
        "ck_habits_unit_allowed",
        "habits",
        type_="check",
    )
    op.drop_constraint(
        "ck_habits_interval_positive",
        "habits",
        type_="check",
    )
    op.drop_column("habits", "unit")
    op.drop_column("habits", "interval")
    op.drop_column("habits", "end_date")
    op.drop_column("habits", "start_date")

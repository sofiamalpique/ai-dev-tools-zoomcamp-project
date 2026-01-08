"""Change transactions.occurred_at to date.

Revision ID: d4e5f6a7b8c9
Revises: c1d2e3f4a5b6
Create Date: 2025-01-08 18:10:00

"""
from alembic import op
import sqlalchemy as sa

revision = "d4e5f6a7b8c9"
down_revision = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "transactions",
        "occurred_at",
        type_=sa.Date(),
        postgresql_using="occurred_at::date",
    )


def downgrade() -> None:
    op.alter_column(
        "transactions",
        "occurred_at",
        type_=sa.DateTime(timezone=True),
        postgresql_using="occurred_at::timestamptz",
    )

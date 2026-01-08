"""Refactor categories into fixed buckets and rename labels.

Revision ID: c1d2e3f4a5b6
Revises: f7b8c9d0e1f2
Create Date: 2025-01-08 17:00:00

"""
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "c1d2e3f4a5b6"
down_revision = "f7b8c9d0e1f2"
branch_labels = None
depends_on = None

CATEGORY_IDS = {
    "house": uuid.UUID("11111111-1111-1111-1111-111111111111"),
    "health": uuid.UUID("22222222-2222-2222-2222-222222222222"),
    "supermarket": uuid.UUID("33333333-3333-3333-3333-333333333333"),
    "fun": uuid.UUID("44444444-4444-4444-4444-444444444444"),
    "subscriptions": uuid.UUID("55555555-5555-5555-5555-555555555555"),
}


def upgrade() -> None:
    op.rename_table("categories", "labels")

    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("key", sa.Text(), nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    categories_table = sa.table(
        "categories",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("key", sa.Text()),
    )
    op.bulk_insert(
        categories_table,
        [{"id": value, "key": key} for key, value in CATEGORY_IDS.items()],
    )

    op.add_column(
        "labels",
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    for key, category_id in CATEGORY_IDS.items():
        op.execute(
            sa.text(
                "UPDATE labels SET category_id = :category_id WHERE kind = :kind"
            ).bindparams(category_id=category_id, kind=key)
        )
    op.alter_column("labels", "category_id", nullable=False)
    op.create_foreign_key(
        "labels_category_id_fkey",
        "labels",
        "categories",
        ["category_id"],
        ["id"],
    )

    op.alter_column("labels", "name", new_column_name="label")
    op.drop_column("labels", "kind")

    op.execute(
        sa.text(
            "ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_category_id_fkey"
        )
    )
    op.alter_column("transactions", "category_id", new_column_name="label_id")
    op.create_foreign_key(
        "transactions_label_id_fkey",
        "transactions",
        "labels",
        ["label_id"],
        ["id"],
    )
    op.alter_column(
        "transactions",
        "description",
        type_=sa.Text(),
        existing_type=sa.String(length=255),
        nullable=True,
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            "ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_label_id_fkey"
        )
    )
    op.alter_column("transactions", "label_id", new_column_name="category_id")
    op.alter_column(
        "transactions",
        "description",
        type_=sa.String(length=255),
        existing_type=sa.Text(),
        nullable=True,
    )

    op.add_column("labels", sa.Column("kind", sa.String(length=50), nullable=True))
    for key, category_id in CATEGORY_IDS.items():
        op.execute(
            sa.text("UPDATE labels SET kind = :kind WHERE category_id = :category_id")
            .bindparams(kind=key, category_id=category_id)
        )
    op.alter_column("labels", "kind", nullable=False)

    op.drop_constraint("labels_category_id_fkey", "labels", type_="foreignkey")
    op.drop_column("labels", "category_id")
    op.alter_column("labels", "label", new_column_name="name")

    op.drop_table("categories")
    op.rename_table("labels", "categories")

    op.create_foreign_key(
        "transactions_category_id_fkey",
        "transactions",
        "categories",
        ["category_id"],
        ["id"],
    )

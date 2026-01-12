import os
import subprocess
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL", "")

if not DATABASE_URL.startswith("postgresql"):
    pytest.skip(
        "DATABASE_URL must point to Postgres to run integration tests.",
        allow_module_level=True,
    )

BACKEND_DIR = Path(__file__).resolve().parents[2]

from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def apply_migrations() -> None:
    subprocess.run(
        ["alembic", "upgrade", "head"],
        cwd=BACKEND_DIR,
        check=True,
    )


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def cleanup_tables() -> None:
    engine = create_engine(DATABASE_URL)
    with engine.begin() as connection:
        connection.execute(
            text(
                "TRUNCATE TABLE labels, transactions, habits, habit_completions "
                "RESTART IDENTITY CASCADE"
            )
        )
    yield


@pytest.mark.integration
def test_health_ok(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.integration
def test_create_label_and_transaction_flow(client: TestClient) -> None:
    categories = client.get("/api/categories").json()
    assert categories, "Expected seeded categories from migrations."

    category_id = categories[0]["id"]
    label_response = client.post(
        "/api/labels",
        json={"label": "Groceries", "category_id": category_id},
    )
    assert label_response.status_code == 201
    label_id = label_response.json()["id"]

    transaction_response = client.post(
        "/api/transactions",
        json={
            "amount": "42.50",
            "occurred_at": "2024-01-01",
            "description": "Weekly shop",
            "label_id": label_id,
        },
    )
    assert transaction_response.status_code == 201

    list_response = client.get("/api/transactions")
    assert list_response.status_code == 200
    data = list_response.json()
    assert len(data) == 1
    assert data[0]["label_id"] == label_id


def _mcp_available() -> bool:
    try:
        response = httpx.get(
            "https://ai-dev-tools-zoomcamp-project-1.onrender.com/health", timeout=1.5
        )
        return response.status_code == 200
    except httpx.RequestError:
        return False


@pytest.mark.integration
def test_weekly_review_suggestion_with_mcp(client: TestClient) -> None:
    if not _mcp_available():
        pytest.skip("MCP server is not running at http://localhost:8001.")

    categories = client.get("/api/categories").json()
    category_id = categories[0]["id"]

    label_response = client.post(
        "/api/labels",
        json={"label": "Groceries", "category_id": category_id},
    )
    label_id = label_response.json()["id"]

    client.post(
        "/api/transactions",
        json={
            "amount": "10.00",
            "occurred_at": "2024-01-02",
            "description": "Weekly shop",
            "label_id": label_id,
        },
    )

    response = client.get(
        "/api/reviews/weekly/suggestion?start_date=2024-01-01&end_date=2024-01-07"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["suggestion"]

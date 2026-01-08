from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app as fastapi_app
from app.models import Category
import app.api as api_module
import app.models  # noqa: F401

SQLALCHEMY_DATABASE_URL = "sqlite+pysqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

CATEGORY_KEYS = ["house", "health", "supermarket", "fun", "subscriptions"]


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    db.add_all([Category(id=uuid4(), key=key) for key in CATEGORY_KEYS])
    db.commit()
    db.close()


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


fastapi_app.dependency_overrides[get_db] = override_get_db
client = TestClient(fastapi_app)


def test_list_categories() -> None:
    list_response = client.get("/api/categories")
    assert list_response.status_code == 200
    data = list_response.json()
    assert len(data) >= 5
    keys = {item["key"] for item in data}
    for key in CATEGORY_KEYS:
        assert key in keys


def test_create_and_list_labels() -> None:
    categories = client.get("/api/categories").json()
    category_id = categories[0]["id"]

    create_response = client.post(
        "/api/labels",
        json={"label": "Groceries", "category_id": category_id},
    )
    assert create_response.status_code == 201

    list_response = client.get("/api/labels")
    assert list_response.status_code == 200
    data = list_response.json()
    assert len(data) == 1
    assert data[0]["label"] == "Groceries"


def test_create_and_list_transactions() -> None:
    categories = client.get("/api/categories").json()
    category_id = categories[0]["id"]

    label_response = client.post(
        "/api/labels",
        json={"label": "Netflix", "category_id": category_id},
    )
    label_id = label_response.json()["id"]

    create_response = client.post(
        "/api/transactions",
        json={
            "amount": "42.50",
            "occurred_at": "2024-01-01",
            "description": "Monthly subscription",
            "label_id": label_id,
        },
    )
    assert create_response.status_code == 201

    list_response = client.get("/api/transactions")
    assert list_response.status_code == 200
    data = list_response.json()
    assert len(data) == 1
    assert data[0]["label_id"] == label_id


def test_weekly_review_totals() -> None:
    categories = client.get("/api/categories").json()
    supermarket = next(
        item for item in categories if item["key"] == "supermarket"
    )

    label_response = client.post(
        "/api/labels",
        json={"label": "Groceries", "category_id": supermarket["id"]},
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
    client.post(
        "/api/transactions",
        json={
            "amount": "5.50",
            "occurred_at": "2024-01-05",
            "description": "Top-up",
            "label_id": label_id,
        },
    )

    response = client.get(
        "/api/reviews/weekly?start_date=2024-01-01&end_date=2024-01-07"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["start_date"] == "2024-01-01"
    assert data["end_date"] == "2024-01-07"
    assert data["total_amount"] == "15.50"

    by_category = {item["category_key"]: item for item in data["by_category"]}
    assert by_category["supermarket"]["total_amount"] == "15.50"


def test_weekly_review_suggestion(monkeypatch) -> None:
    categories = client.get("/api/categories").json()
    supermarket = next(
        item for item in categories if item["key"] == "supermarket"
    )

    label_response = client.post(
        "/api/labels",
        json={"label": "Groceries", "category_id": supermarket["id"]},
    )
    label_id = label_response.json()["id"]

    client.post(
        "/api/transactions",
        json={
            "amount": "8.00",
            "occurred_at": "2024-01-03",
            "description": "Midweek run",
            "label_id": label_id,
        },
    )

    monkeypatch.setattr(
        api_module,
        "fetch_weekly_suggestion",
        lambda summary: "Test suggestion",
    )

    response = client.get(
        "/api/reviews/weekly/suggestion?start_date=2024-01-01&end_date=2024-01-07"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["suggestion"] == "Test suggestion"
    assert data["summary"]["total_amount"] == "8.00"

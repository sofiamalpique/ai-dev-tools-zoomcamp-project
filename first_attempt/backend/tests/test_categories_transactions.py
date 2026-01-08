from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app as fastapi_app
from app.models import Category
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
            "occurred_at": "2024-01-01T10:00:00Z",
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

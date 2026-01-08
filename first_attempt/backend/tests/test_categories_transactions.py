from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app as fastapi_app
import app.models  # noqa: F401

SQLALCHEMY_DATABASE_URL = "sqlite+pysqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


fastapi_app.dependency_overrides[get_db] = override_get_db
client = TestClient(fastapi_app)


def test_create_and_list_categories() -> None:
    create_response = client.post(
        "/api/categories",
        json={"name": "Housing", "kind": "house"},
    )
    assert create_response.status_code == 201

    list_response = client.get("/api/categories")
    assert list_response.status_code == 200
    data = list_response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Housing"


def test_create_and_list_transactions() -> None:
    category_response = client.post(
        "/api/categories",
        json={"name": "Groceries", "kind": "supermarket"},
    )
    category_id = category_response.json()["id"]

    create_response = client.post(
        "/api/transactions",
        json={
            "amount": "42.50",
            "occurred_at": "2024-01-01T10:00:00Z",
            "description": "Weekly shop",
            "category_id": category_id,
        },
    )
    assert create_response.status_code == 201

    list_response = client.get("/api/transactions")
    assert list_response.status_code == 200
    data = list_response.json()
    assert len(data) == 1
    assert data[0]["category_id"] == category_id

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


def create_habit(
    *,
    name: str,
    start_date: str,
    end_date: str | None = None,
    interval: int = 1,
    unit: str = "day",
) -> dict:
    payload = {
        "name": name,
        "start_date": start_date,
        "interval": interval,
        "unit": unit,
    }
    if end_date is not None:
        payload["end_date"] = end_date

    response = client.post("/api/habits", json=payload)
    assert response.status_code == 201
    return response.json()


def test_habits_for_date_weekly_interval() -> None:
    habit = create_habit(
        name="Gym",
        start_date="2024-01-01",
        interval=2,
        unit="week",
    )
    habit_id = habit["id"]

    due_response = client.get("/api/habits/for-date?date=2024-01-01")
    assert due_response.status_code == 200
    due_ids = {item["id"] for item in due_response.json()}
    assert habit_id in due_ids

    not_due_response = client.get("/api/habits/for-date?date=2024-01-08")
    assert not_due_response.status_code == 200
    not_due_ids = {item["id"] for item in not_due_response.json()}
    assert habit_id not in not_due_ids

    due_again_response = client.get("/api/habits/for-date?date=2024-01-15")
    assert due_again_response.status_code == 200
    due_again_ids = {item["id"] for item in due_again_response.json()}
    assert habit_id in due_again_ids


def test_habits_toggle_and_completions() -> None:
    habit = create_habit(name="Drink water", start_date="2024-02-01")
    habit_id = habit["id"]

    list_response = client.get("/api/habits")
    assert list_response.status_code == 200
    habit_ids = {item["id"] for item in list_response.json()}
    assert habit_id in habit_ids

    date_str = "2024-02-01"
    toggle_on = client.post(
        f"/api/habits/{habit_id}/toggle",
        json={"date": date_str},
    )
    assert toggle_on.status_code == 200
    assert toggle_on.json()["status"] == "checked"

    due_response = client.get(f"/api/habits/for-date?date={date_str}")
    assert due_response.status_code == 200
    due_entry = next(
        item for item in due_response.json() if item["id"] == habit_id
    )
    assert due_entry["checked"] is True

    completions = client.get(f"/api/habits/completions?date={date_str}")
    assert completions.status_code == 200
    data = completions.json()
    assert data["date"] == date_str
    assert habit_id in data["completed_habit_ids"]

    toggle_off = client.post(
        f"/api/habits/{habit_id}/toggle",
        json={"date": date_str},
    )
    assert toggle_off.status_code == 200
    assert toggle_off.json()["status"] == "unchecked"

    due_after = client.get(f"/api/habits/for-date?date={date_str}")
    assert due_after.status_code == 200
    due_after_entry = next(
        item for item in due_after.json() if item["id"] == habit_id
    )
    assert due_after_entry["checked"] is False

    completions_after = client.get(f"/api/habits/completions?date={date_str}")
    assert completions_after.status_code == 200
    assert completions_after.json()["completed_habit_ids"] == []


def test_habit_toggle_non_due_date() -> None:
    habit = create_habit(
        name="Stretch",
        start_date="2024-01-01",
        interval=1,
        unit="week",
    )
    response = client.post(
        f"/api/habits/{habit['id']}/toggle",
        json={"date": "2024-01-02"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Habit not scheduled for this date"


def test_habits_monthly_last_day_rule() -> None:
    habit = create_habit(
        name="Pay rent",
        start_date="2024-01-31",
        interval=1,
        unit="month",
    )
    habit_id = habit["id"]

    due_response = client.get("/api/habits/for-date?date=2024-02-29")
    assert due_response.status_code == 200
    due_ids = {item["id"] for item in due_response.json()}
    assert habit_id in due_ids

    not_due_response = client.get("/api/habits/for-date?date=2024-02-28")
    assert not_due_response.status_code == 200
    not_due_ids = {item["id"] for item in not_due_response.json()}
    assert habit_id not in not_due_ids


def test_habit_toggle_unknown_habit() -> None:
    response = client.post(
        f"/api/habits/{uuid4()}/toggle",
        json={"date": "2024-02-01"},
    )
    assert response.status_code == 404

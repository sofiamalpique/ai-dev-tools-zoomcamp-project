# Attempt 1 (Hello-world skeleton)

Minimal, shippable full stack scaffold for the AI Dev Tools project attempt.

## Prerequisites

- Docker Desktop (with Docker Compose v2)
- Python 3.11+ (only needed for running tests locally)

## How to run

```bash
cd first_attempt
cp .env.example .env
docker compose up --build
```

## Frontend

- Open http://localhost:5173
- The UI calls http://localhost:8000/health and http://localhost:8001/health directly.

## Database migrations

```bash
docker compose exec backend alembic upgrade head
```

## Health endpoints

```bash
curl http://localhost:8000/health
curl http://localhost:8001/health
```

## Categories, labels, and transactions

```bash
curl http://localhost:8000/api/categories

curl -X POST http://localhost:8000/api/labels \
  -H "Content-Type: application/json" \
  -d '{"label":"Groceries","category_id":"<category-uuid>"}'

curl http://localhost:8000/api/labels

curl -X POST http://localhost:8000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"amount":"42.50","occurred_at":"2024-01-01","description":"Weekly shop","label_id":"<label-uuid>"}'

curl http://localhost:8000/api/transactions
```

## Habits

```bash
curl http://localhost:8000/api/habits

curl -X POST http://localhost:8000/api/habits \
  -H "Content-Type: application/json" \
  -d '{"name":"Drink water"}'

curl "http://localhost:8000/api/habits/completions?date=2024-01-01"

curl -X POST http://localhost:8000/api/habits/<habit-uuid>/toggle \
  -H "Content-Type: application/json" \
  -d '{"date":"2024-01-01"}'
```

## Weekly review

```bash
curl "http://localhost:8000/api/reviews/weekly?start_date=2024-01-01&end_date=2024-01-07"
curl "http://localhost:8000/api/reviews/weekly/suggestion?start_date=2024-01-01&end_date=2024-01-07"
```

## Backend API docs

- http://localhost:8000/docs

## Run tests (backend)

```bash
cd first_attempt/backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

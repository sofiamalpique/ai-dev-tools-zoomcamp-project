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

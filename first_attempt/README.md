# Life Ops Planner (Attempt 1)

## Problem statement
Keeping weekly spending and habit routines in one place is hard when data lives
in separate notes or spreadsheets. This app gives individuals a lightweight
dashboard to track categories, labels, transactions, and habit schedules, then
summarizes weekly totals with a short suggestion so they can stay on top of
their personal operations.

## What the system does (features)
- Shows backend and MCP health status from the UI.
- Lists pre-seeded spending categories (house, health, supermarket, fun,
  subscriptions).
- Creates and lists labels tied to a category.
- Creates and lists transactions with dates and optional descriptions.
- Creates habits with schedules, shows habits due for a date, and toggles
  completion.
- Generates weekly review totals and a suggestion via the MCP service.

## Demo
- Screenshot: Overview dashboard (placeholder)
- Screenshot: Habits + weekly review (placeholder)
- GIF: Create label + transaction + weekly review (placeholder)

How to record a quick demo:
1) Start the stack with Docker (see "How to run (Docker)").
2) Open `http://localhost:5173` and show both health cards.
3) Create a label, then add a transaction for that label.
4) Run a weekly review and show the suggested advice.
5) Create a habit, toggle it complete for today, and show the due list.

## Architecture
Services in `first_attempt/docker-compose.yml`:
- frontend: React + Vite UI on port 5173.
- backend: FastAPI API on port 8000.
- mcp_server: FastMCP server on port 8001 for weekly suggestions.
- database: Postgres 16 for categories, labels, transactions, and habits.

Data flow:
```
[Browser]
   |
   v
[Frontend: React/Vite] ---> GET/POST ---> [Backend: FastAPI] ---> [Postgres]
                                       \
                                        \--> [MCP Server: FastMCP]
```

## Tech stack
- React 18 + Vite 5 + TypeScript: UI rendering and client-side state
  (`first_attempt/frontend/`).
- FastAPI: REST API and OpenAPI docs (`first_attempt/backend/app/main.py`).
- SQLAlchemy + Alembic: ORM models and migrations
  (`first_attempt/backend/app/models.py`,
  `first_attempt/backend/migrations/`).
- Postgres 16: persistent storage (docker-compose `db` service).
- FastMCP + Starlette: MCP server that returns weekly suggestions
  (`first_attempt/mcp_server/app/main.py`).
- Docker Compose: one-command local stack (`first_attempt/docker-compose.yml`).

## AI tooling & MCP usage
The MCP tool lives in `first_attempt/mcp_server/app/main.py` as
`weekly_review_suggestion(input: str)`. The backend calls it in
`first_attempt/backend/app/api.py` inside `fetch_weekly_suggestion`, which is
invoked by the endpoint `GET /api/reviews/weekly/suggestion`.

Example backend call that uses MCP:
```bash
curl "http://localhost:8000/api/reviews/weekly/suggestion?start_date=2024-01-01&end_date=2024-01-07"
```

Expected response shape (high level):
```json
{
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "summary": { "...": "weekly totals and by-category breakdown" },
  "suggestion": "string"
}
```

## API contract (OpenAPI)
FastAPI serves the runtime OpenAPI spec at `http://localhost:8000/openapi.json`.
This repo also commits a snapshot at `first_attempt/openapi.json`.

### How to regenerate OpenAPI
Install backend dependencies, then export the snapshot:
Run this from `first_attempt/backend` so the app imports resolve correctly.
```bash
cd first_attempt/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/export_openapi.py
```

## Key API endpoints
- `GET /api/categories`
- `GET /api/labels`, `POST /api/labels`
- `GET /api/transactions`, `POST /api/transactions`
- `GET /api/habits`, `GET /api/habits/for-date`, `POST /api/habits/{habit_id}/toggle`
- `GET /api/reviews/weekly/suggestion`

## How to run (Docker)
```bash
cd first_attempt
cp .env.example .env
docker compose up --build
```

Frontend API base defaults to `http://localhost:8000`. If the backend runs
elsewhere, set `VITE_API_BASE_URL` before starting the frontend. The MCP base
defaults to `http://localhost:8001`; set `VITE_MCP_BASE_URL` if MCP runs
elsewhere.

Database migrations run automatically when the backend container starts.

Open:
- `http://localhost:5173` (frontend UI)
- `http://localhost:8000/docs` (FastAPI docs)

## How to run (Local dev)
Docker is the recommended way to run everything. Local dev is optional.

Backend (requires a running Postgres instance, e.g. `docker compose up db`):
```bash
cd first_attempt/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
export DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/app
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Frontend:
```bash
cd first_attempt/frontend
npm install
npm run dev
```

Optional: override the API and MCP bases before starting the dev server:
```bash
VITE_API_BASE_URL=http://localhost:8000 VITE_MCP_BASE_URL=http://localhost:8001 npm run dev
```

## Testing
Frontend unit tests:
```bash
cd first_attempt/frontend
npm ci
npm test
```

Backend unit tests:
```bash
cd first_attempt/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
pytest
```

## Unit vs Integration tests
Unit tests (fast, no external services):
- Frontend: `npm test` in `first_attempt/frontend`.
- Backend: `pytest` in `first_attempt/backend` (uses in-memory SQLite).

Integration tests (real Postgres, optional MCP):
```bash
cd first_attempt
docker compose up -d db mcp_server
export DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/app
cd backend
alembic upgrade head
pytest tests/integration
```

Note: the weekly suggestion integration test is skipped unless the MCP server
is running at `http://localhost:8001`.

## CI
GitHub Actions runs on push and pull request and executes:
- Backend: install `requirements.txt` + `requirements-dev.txt`, then `pytest`.
- Frontend: `npm ci`, `npm run build`, and `npm run test --if-present`.

Run the same checks locally:
```bash
# Backend
cd first_attempt/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
pytest

# Frontend
cd first_attempt/frontend
npm ci
npm run build
npm run test --if-present
```

## Deployment (Free Tier)
### Live deployment URLs (for grading)
- Frontend (Vercel): https://ai-dev-tools-zoomcamp-project.vercel.app/
- Backend API (Render): https://ai-dev-tools-zoomcamp-project.onrender.com
- Backend health: https://ai-dev-tools-zoomcamp-project.onrender.com/health
- MCP server (Render): https://ai-dev-tools-zoomcamp-project-1.onrender.com
- MCP health: https://ai-dev-tools-zoomcamp-project-1.onrender.com/health

### Proof (curl)
```bash
curl https://ai-dev-tools-zoomcamp-project.onrender.com/health
curl https://ai-dev-tools-zoomcamp-project-1.onrender.com/health
curl "https://ai-dev-tools-zoomcamp-project.onrender.com/api/reviews/weekly/suggestion?start_date=2024-01-01&end_date=2024-01-07"
```

### Proof (screenshots)
Screenshots are in `first_attempt/screenshots/`:
- `first_attempt/screenshots/application.png`
- `first_attempt/screenshots/frontend.png`
- `first_attempt/screenshots/backend.png`
- `first_attempt/screenshots/mcp-server.png`
- `first_attempt/screenshots/database.png`

### Frontend (Vercel)
1) Push this repo to GitHub.
2) In Vercel, create a new project from the repo.
3) Set the Root Directory to `first_attempt/frontend`.
4) Set the Build Command to `npm run build`.
5) Add Environment Variables:
   - `VITE_API_BASE_URL` (backend URL, e.g. `https://your-backend.onrender.com`)
   - `VITE_MCP_BASE_URL` (MCP URL, e.g. `https://your-mcp.onrender.com`)
6) Deploy. If you change env vars later, trigger a redeploy to apply them.

### Backend (Render Free Web Service)
1) Create a new Web Service on Render from this GitHub repo.
2) Set the Root Directory to `first_attempt/backend`.
3) Environment → add variables:
   - `DATABASE_URL` (Neon connection string).
   - `MCP_BASE_URL` (optional; only if you deploy MCP separately).
   - `CORS_ORIGINS` (comma-separated list of allowed origins).
4) Build Command: `pip install -r requirements.txt`
5) Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6) Deploy and note the Render URL (e.g. `https://your-backend.onrender.com`).

Note: CORS origins are configured via `CORS_ORIGINS` in
`first_attempt/backend/app/main.py`.

### Database (Neon Free Postgres)
1) Create a free Neon project and database.
2) Copy the connection string (Postgres URL).
3) Use it as `DATABASE_URL` in Render.

Required environment variables:
- Backend (Render): `DATABASE_URL` (required), `MCP_BASE_URL` (optional if
  hosting MCP), and `CORS_ORIGINS`.
- Frontend (Vercel build or local): `VITE_API_BASE_URL` and
  `VITE_MCP_BASE_URL` pointing to your deployed backend and MCP URLs.

Examples:
- Local dev: `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- Vercel: `CORS_ORIGINS=https://<your-vercel-app>.vercel.app`
- Frontend env: `VITE_MCP_BASE_URL=https://your-mcp.onrender.com`

## Troubleshooting
- Port already in use (5173/8000/8001/5432): stop the other process or change
  the port mapping in `first_attempt/docker-compose.yml`.
- `DATABASE_URL is not set`: ensure `.env` exists for Docker, or export
  `DATABASE_URL` when running locally.
- Missing tables or empty categories: run `alembic upgrade head` (see Docker or
  local steps).
- CORS errors in the browser: use `http://localhost:5173` or update allowed
  origins in `first_attempt/backend/app/main.py` and
  `first_attempt/mcp_server/app/main.py`.
- Weekly review suggestion returns 502: check `http://localhost:8001/health` in
  the browser; inside Docker the backend reaches MCP via
  `http://mcp_server:8001`.

## Roadmap (next improvements)
- Add deployment instructions and production configuration.
- Add frontend tests and basic authentication.

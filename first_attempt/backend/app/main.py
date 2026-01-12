import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as api_router

app = FastAPI()

_cors_origins_env = os.environ.get("CORS_ORIGINS", "").strip()
if _cors_origins_env:
    cors_origins = [
        origin.strip()
        for origin in _cors_origins_env.split(",")
        if origin.strip()
    ]
else:
    cors_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/ping")
def ping() -> dict[str, str]:
    return {"message": "pong"}

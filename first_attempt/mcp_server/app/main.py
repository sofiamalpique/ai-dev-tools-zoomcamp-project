from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route

mcp = FastMCP("ai-dev-tools-mcp")


@mcp.tool()
def weekly_review_suggestion(input: str) -> str:
    text = input.lower()
    if "supermarket" in text:
        return "Supermarket spending stands out—try a tighter grocery list next week."
    if "subscriptions" in text:
        return "Consider reviewing subscriptions to see if any can be paused."
    if "health" in text:
        return "Great focus on health—keep that momentum going with small wins."
    if "fun" in text:
        return "Plan one low-cost fun activity to keep spending balanced."
    if "house" in text:
        return "House expenses look active—set aside a small buffer for surprises."
    return "Nice work tracking your week—set one small goal for next week."


async def health(request: Request) -> JSONResponse:
    return JSONResponse({"status": "ok"})


async def suggest_weekly_review(request: Request) -> JSONResponse:
    payload = await request.json()
    input_text = payload.get("input", "") if isinstance(payload, dict) else ""
    suggestion = weekly_review_suggestion(input_text)
    return JSONResponse({"suggestion": suggestion})


app = Starlette(
    routes=[
        Route("/health", health, methods=["GET"]),
        Route("/suggest-weekly-review", suggest_weekly_review, methods=["POST"]),
        Mount("/", app=mcp.streamable_http_app()),
    ]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ai-dev-tools-zoomcamp-project.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

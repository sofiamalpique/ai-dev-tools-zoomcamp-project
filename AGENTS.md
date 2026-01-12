# AGENTS.md

This repo uses AI assistance to speed up analysis, documentation, and coding
tasks while keeping changes reviewable and auditable.

## Tools used
- Codex CLI (OpenAI): repo inspection, README updates, and code edits.
- ChatGPT (OpenAI): rubric interpretation, summarization, and review notes.

## Workflow
Typical flow for AI-assisted changes:
1) Prompt with task scope and constraints.
2) Make edits with small, reviewable patches.
3) Run relevant checks/tests when available.
4) Summarize changes and next steps before commit.

## MCP in this system
The MCP server is part of the application stack, not a dev-time tool. The
backend calls the MCP tool to generate weekly review suggestions, and the
frontend surfaces that output in the UI.

## Prompt library (examples)
- "Review this repo for production readiness and list concrete gaps."
- "Update the README to match the course rubric, with exact commands."
- "Export the FastAPI OpenAPI spec and save it to a snapshot file."
- "Summarize API endpoints and map them to frontend usage."

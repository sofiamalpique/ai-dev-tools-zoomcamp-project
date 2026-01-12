from __future__ import annotations

import json
from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BACKEND_DIR))

from app.main import app  # noqa: E402


def main() -> None:
    output_path = Path(__file__).resolve().parents[2] / "openapi.json"
    payload = app.openapi()
    output_path.write_text(
        json.dumps(payload, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()

#!/usr/bin/env bash
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$here/.."

python -m venv .venv || true
source .venv/bin/activate
pip install -r ./server/requirements.txt
uvicorn server.app:app --host 0.0.0.0 --port 9110

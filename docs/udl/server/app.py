from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import yaml
from pathlib import Path
import time, json

from .records_store import RecordsStore

APP_ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = APP_ROOT / "config"
AUDIT_LOG = APP_ROOT / "audit" / "trace.log"
DATA_DIR = APP_ROOT / "data"

app = FastAPI(title="UDL v2", version="0.1")

store = RecordsStore(DATA_DIR / "records.json")

def load_yaml(name: str) -> dict:
    p = CONFIG_DIR / name
    return yaml.safe_load(p.read_text(encoding="utf-8"))

@app.get("/api/health")
def health():
    return {"ok": True, "ts": int(time.time())}

@app.get("/api/ui-config")
def ui_config():
    roles = load_yaml("roles.yaml")
    gov = load_yaml("governance.yaml")
    limits = load_yaml("limits.yaml")
    return {
        "defaultRoute": "/analytics",
        "roles": roles,
        "governance": gov,
        "limits": limits,
        "modules": {
            "udl": "/ui/modules/udl/index.html?embed=1",
            "pbj": "/ui/modules/pbj/index.html?embed=1",
            "ship": "/ui/modules/ship/index.html?embed=1",
            "winboard": "/ui/modules/winboard/index.html?embed=1",
        }
    }

@app.post("/api/audit/event")
async def audit_event(req: Request):
    payload = await req.json()
    line = json.dumps({"ts": int(time.time()), **payload}, ensure_ascii=False)
    AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)
    with AUDIT_LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")
    return {"ok": True}


# =====================================================
# Records API (local-first persistence)
# =====================================================

@app.get("/api/records")
def list_records(type: str | None = None, workspaceId: str | None = None):
    return store.list(type=type, workspace_id=workspaceId)


@app.get("/api/records/{record_id}")
def get_record(record_id: str):
    r = store.get(record_id)
    if not r:
        raise HTTPException(status_code=404, detail="record not found")
    return r


@app.post("/api/records")
async def upsert_record(req: Request):
    payload = await req.json()
    r = store.upsert(payload)
    return r


@app.delete("/api/records/{record_id}")
def delete_record(record_id: str):
    ok = store.delete(record_id)
    if not ok:
        raise HTTPException(status_code=404, detail="record not found")
    return {"ok": True}

@app.get("/")
def root_redirect():
    return RedirectResponse(url="/ui/shell/index.html")

# Some browsers request /favicon.ico at the site root.
@app.get("/favicon.ico")
def favicon_redirect():
    return RedirectResponse(url="/ui/favicon.ico")

@app.get("/ui")
def ui_redirect():
    return RedirectResponse(url="/ui/shell/index.html")

@app.get("/ui/")
def ui_slash_redirect():
    return RedirectResponse(url="/ui/shell/index.html")


# Compatibility redirects
@app.get("/ui/shell/index.htm")
def shell_index_htm_redirect():
    return RedirectResponse(url="/ui/shell/index.html")

# Serve UI (static)
ui_path = APP_ROOT / "web"
app.mount("/ui", StaticFiles(directory=ui_path, html=False), name="ui")

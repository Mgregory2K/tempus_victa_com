# UDL v2 Implementation Plan (UI-first, modules later)

**Your directive:** start with the *badass UI* (the finished look) on day 1, then grow functionality module-by-module.  
**Deployment target:** **LAN-accessible** on `192.168.40.0/24` (laptop + phone), with data saved on the server (local-first today; future cloud migration is explicit + gated).

---

## 0) Decisions locked in
- **UI-first:** shell ships “finished looking” immediately (mock-quality), powered by mock data and stub APIs.
- **Backend:** **FastAPI** (Python **3.13.9**).
- **Modules:** **Option A (iframe micro-apps)** for v2 start.
- **Roles:** `Admin`, `Reader`, `Contributor`, `Demo` (Demo is ephemeral; auto-purged on logout).
- **Naming:** `udl_v2` (no extra “D”).
- **Governance:** follow your `ai_government.zip` + PBJ doctrine; suggest changes only when it reduces risk / improves clarity.

---

## 1) North Star UX (what “done” looks like for v2 baseline)
- Persistent **App Shell**: left sidebar + top bar + status/quick actions + user/workspace switcher.
- **Analytics** landing that looks like the approved mock (cards + chart surfaces + table).
- **Settings** surface that feels “real” (subnav, forms, sections, save states).
- **Theme system** with tokens (dark default + light supported).
- **Module slots**: UDL / PBJ / Ship / WinBoard load inside the shell and inherit design tokens.
- Proper UI states: loading / empty / error / disabled / tooltip patterns.

---

## 2) Repo structure (correct once, no re-spaghetti)
```
udl_v2/
├── README.md
├── .gitignore
├── docs/
│   ├── udl_v2_implementation_plan.md
│   ├── ui_spec.md
│   ├── module_contract.md
│   └── decisions.md
│
├── config/
│   ├── governance.yaml
│   ├── roles.yaml
│   └── limits.yaml
│
├── core/
│   ├── decision_engine.py
│   ├── authority.py
│   ├── termination.py
│   └── explainability.py
│
├── audit/
│   ├── trace.log
│   └── export.py
│
├── server/
│   ├── app.py
│   ├── requirements.txt
│   └── __init__.py
│
├── web/
│   ├── shell/
│   │   ├── index.html
│   │   ├── shell.js
│   │   ├── shell.css
│   │   └── assets/
│   ├── shared/
│   │   ├── tokens.css
│   │   ├── components.css
│   │   ├── mock_data.js
│   │   └── utils.js
│   └── modules/
│       ├── udl/
│       ├── pbj/
│       ├── ship/
│       └── winboard/
│
└── scripts/
    ├── run_dev.ps1
    └── run_dev.sh
```

---

## 3) LAN-first runtime (laptop + phone)
**Binding:**
- API: `uvicorn server.app:app --host 0.0.0.0 --port 9100`
- Static UI: served by FastAPI (so you only open one port)

**Access:**
- From phone on same LAN: `http://<laptop-ip>:9110/ui/`

**Data persistence:**
- Server stores data locally in `udl_v2/data/` (gitignored).
- Demo role stores data in a session sandbox and purges on logout/expiry.

---

## 4) Module contract (prevents refactors later)

### 4.1 Embed contract
- Shell loads modules as:
  - `/ui/modules/<name>/index.html?embed=1`
- When `embed=1`, module hides its own chrome.
- Modules inherit tokens by importing `/ui/shared/tokens.css`.

### 4.2 Messaging contract (reserved now, used later)
`postMessage` between shell and module:
- Shell → Module: `{ type: "shell:setContext", theme, role, workspaceId }`
- Module → Shell: `{ type: "module:toast", level, message }`
- Module → Shell: `{ type: "module:navigate", path }`

---

## 5) Governance integration (minimal but real)
Pulled straight from your government/doctrine themes:
- **Human authority is absolute**
- **Local-first reasoning**
- **Remote expansion is gated and observable**
- **Memory is a privilege (intentional + reversible)**

### v2 baseline enforcement
- `roles.yaml` determines what buttons/actions are enabled.
- `governance.yaml` holds *autonomy + gating* flags (e.g., remote calls disabled).
- `limits.yaml` holds simple throttles (payload caps, retries).
- `audit/trace.log` is append-only for “important actions” (export, purge, config change).

---

## 6) Build sequence (what we implement, in order)

### Phase 0 — Scaffold + run on LAN (now)
- Create structure + scripts
- FastAPI serves:
  - `/api/health`
  - `/api/ui-config` (nav + roles + module map)
  - `/api/audit/event` (append-only)
  - `/ui/*` static shell + modules

### Phase 1 — Pixel-polished shell (now)
- Tokens + components (cards/tables/forms)
- Analytics page that looks finished using mock data
- Settings page that looks finished and has realistic interactions (save/loading states)
- Module loader routes:
  - `/analytics`, `/udl`, `/pbj`, `/ship`, `/winboard`, `/settings`, `/audit`

### Phase 2 — Module stubs that look real
- Each module is a “real” UI skeleton: sections, tables, forms, empty states
- No business logic required; mock data only

### Phase 3 — First real function (after UI is locked)
- Start with “boring but valuable”:
  1) Data Sources UI → persists to server
  2) Exports → JSON/CSV
  3) Audit viewer
  4) PBJ Intake persistence
  5) UDL KPI persistence

---

## 7) Definition of Done (v2 UI-first baseline)
- UI looks “shippable” without excuses
- Navigation is correct, responsive enough, and consistent
- Modules load cleanly via iframe; embed mode works
- Demo role purges its data on logout
- Runs on LAN; phone can open it; data saved on server

---

## 8) What I generated as the starting scaffold
A full `udl_v2` scaffold folder with:
- shell + tokens + component CSS
- module stubs
- FastAPI server serving UI + stub API
- config YAMLs + minimal governance plumbing stubs
- run scripts

Next: you drop this into your new project folder and run one command.

---

## Governance suggestions (minimal)
- Add a single explicit flag: `remote_calls: false` (default) in governance.yaml.
- Add Demo role rule: `storage_mode: ephemeral` + `purge_on_logout: true`.
- Add a “LAN allowlist” (optional) in limits.yaml: `allowed_subnets: ["192.168.40.0/24"]`.

If you want stricter security later, we can add auth + CSRF + HTTPS, but for now this is UI-first and LAN-only.

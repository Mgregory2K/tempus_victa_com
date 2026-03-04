# The PBJ Initiative — v2.0 Audit-Grade (Workspace)

**Goal:** Run PBJ analyses that are *auditable*, *repeatable*, and *evidence-first*.

## What’s in this ZIP

### 1) Authoritative doctrine (do not edit casually)
- `authorities/pbj_v2_audit_grade/`  
  Contains the PBJ v2.0 audit-grade core, including:
  - Source Register templates (`00_source_register/`)
  - Runbook (`pbj_v2_runbook.md`)
  - Scoring rubric and audit templates
  - Mermaid audit flow (`pbj_audit_flow.mmd`)
  - PBJ lifecycle docs (`00_pbj_charter.md` … `10_pbj_post_decision_actions.md`)

### 2) Decisions (actual PBJ runs)
- `decisions/runs/`  
  Completed PBJ decision records (MD). Treat these as **decision artifacts**.

### 3) Examples (reference implementations)
- `examples/governed_social_network_case/`  
  A complete PBJ v2.0 example run with:
  - Claims matrix
  - Bibliography
  - Audit trail

### 4) Outputs (executive artifacts)
- `outputs/`  
  Generated executive bundles, charts, docs.
- `outputs/docs/`  
  Presentation docs (DOCX) for the Source Register / Audit Flow.

### 5) Interfaces (optional)
- `interfaces/web_intake/`  
  Web intake artifacts (optional UI layer). PBJ itself does **not** require these.

### 6) Archive
- `.old/`  
  Legacy standalone zips and prior root artifacts preserved for history.

## How to run PBJ v2.0 (quick)
1. Start with the runbook: `authorities/pbj_v2_audit_grade/pbj_v2_runbook.md`
2. Create a new initiative folder under `analysis/<initiative_name>/` (see `authorities/.../analysis_template/README.md`)
3. Populate the Source Register first, then Claims Matrix, then score.
4. If Evidence Sufficiency is **FAIL**, PBJ must output **HOLD** only.

Generated: 2026-02-01

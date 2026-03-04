# PBJ Source Register (PBJ v2.0 — Audit-Grade)

**Purpose:** Provide an external-evidence-first layer that PBJ consumes to produce auditable decisions.

## What this ZIP contains
- `00_source_register/` — templates + registers for evidence collection and citation
- `pbj_audit_flow.mmd` — Mermaid flow for the auditable PBJ process
- `pbj_audit_trail_template.md` — reproducible audit-trail structure
- `pbj_scoring_rubric.md` — scoring + confidence + assumption-density rules
- `pbj_claims_matrix_template.csv` — claim→evidence mapping (machine-friendly)

## How to use (quick)
1. Create a new analysis folder (per initiative/project) and copy `00_source_register/` into it.
2. Populate sources and claims *before* assigning PBJ scores.
3. Run PBJ scoring only after the **Source Sufficiency Check** passes.
4. Publish verdict with: scores + confidence bands + assumption density + bibliography.

## Version
- Intended to support **PBJ v2.0 — Audit-Grade** (tag: `v2.0-pbj-audit-grade`)
- Generated: 2026-02-01

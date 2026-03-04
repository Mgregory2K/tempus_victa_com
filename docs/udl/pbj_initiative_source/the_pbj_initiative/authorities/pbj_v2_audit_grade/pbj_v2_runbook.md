# PBJ v2.0 Runbook — Audit-Grade

**Effective date:** 2026-02-01


## Autonomous Evidence Mode (Default Execution)

Autonomous Evidence Mode is the default execution mode for PBJ v2.0 when the user invokes PBJ without supplying a pre-populated Source Register.

In this mode, the system is responsible for assembling its own evidence base prior to scoring or verdicts.

### Operating Rules

1. The system MUST autonomously gather external evidence and populate the Source Register across all required categories:
   - Behavioral / cognitive
   - Market / economic
   - Governance / operational precedent
   - Regulatory / legal (where applicable)
   - Contrarian / disconfirming evidence

2. Evidence gathered in this mode becomes the primary basis for PBJ scoring unless explicitly overridden by user-supplied sources.

3. Each claim that materially affects scoring MUST be traceable to at least one external source and recorded in the Claims Matrix with:
   - Source ID
   - Source tier (A / B / C)
   - Relevant PBJ axis tags

4. Contrarian evidence MUST be actively sought and recorded. Absence of disconfirming evidence must be explicitly stated.

5. The Evidence Sufficiency Gate (PASS / WARN / FAIL) is determined by the completeness, quality, and balance of autonomously gathered sources.

6. A GO / NO-GO verdict may NOT be produced unless the following artifacts exist:
   - Populated Source Register
   - Claims Matrix with source mapping
   - Bibliography with access dates
   - Confidence bands for each axis
   - Assumption Density Score

7. Where evidence is incomplete or ambiguous, PBJ MUST reduce confidence, flag assumptions, and surface uncertainty rather than invent support.

This mode ensures PBJ remains auditable, externally grounded, and resistant to internally self-reinforcing conclusions.

This runbook describes the required order of operations for PBJ v2.0 analyses.

## 1) Start: Intake
- Complete `01_pbj_intake_statement.md`
- Define scope, stakeholders, constraints
- Set initial Evidence Sufficiency status (likely Exploratory)

## 2) Build Evidence: Source Register
- Populate `00_source_register/` registers:
  - behavioral, market/economic, governance precedents, regulatory/legal, contrarian
- Assign Tier (A/B/C) and axis tags for each source

## 3) Create Claims Matrix
- Copy `pbj_claims_matrix_template.csv` → `pbj_claims_matrix.csv`
- List *every claim* that drives scoring and map it to sources

## 4) Evidence Sufficiency Gate
- PASS/WARN/FAIL per the manifest
- If FAIL → stop: produce Exploratory/Hold only

## 5) Run PBJ Scoring (Downstream)
- Use `pbj_scoring_rubric.md`
- Record confidence band + Assumption Density Score
- Populate axis sections in the PBJ files as needed

## 6) Produce Verdict
- Complete `09_pbj_go_no_go_report.md`
- Attach / link: Claims Matrix + Bibliography + Audit Trail

## 7) Post-Decision Learning
- Update `10_pbj_post_decision_actions.md` with outcome feedback
- Feed reality back into Source Register

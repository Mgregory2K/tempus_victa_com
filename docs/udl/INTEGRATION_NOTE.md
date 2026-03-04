UDL v2 Integration (Stable Baseline)

This build restores the working per-module UIs (so PBJ/UDL are not blank) and adds a shared Records core
for the upcoming integration work.

Records core (UI-only):
- web/shared/records.js
- web/shared/records.seed.js

Next step: wire WinBoard/Ship/PBJ/UDL to read/write Records instead of mock data, without changing HTML.

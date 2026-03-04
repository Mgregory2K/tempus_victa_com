# PBJ_Decision_System v0.3.0 (One-Zip, One-Command)

## Goal
Drop this folder anywhere, run **PBJ <business>**, and get a dated bundle ZIP containing:
- Canonical PBJ data markdown (copied/renamed)
- Executive Word report (charts + KPI cards)
- Charts folder
- metrics.json

## Prereqs (one-time)
1) Python 3.x installed
2) Install deps:
```powershell
python -m pip install -r requirements.txt
```

## Run (dog-simple)
### Option A (recommended): from the tools folder
```powershell
cd C:\Projects\GreenGregoryGroupLLC\PBJ_Decision_System\tools
.\PBJ.ps1 -Business "Document_Hardening"
```
It will auto-find the latest matching `Document_Hardening*_PBJ_*Test*.md` in the current folder (or one level up).
If it can't, specify the input file:

```powershell
.\PBJ.ps1 -Business "Document_Hardening" -InputPBJ "C:\Projects\GreenGregoryGroupLLC\Document_Hardening_PBJ_Test_PASS_20260125.md"
```

### Option B: command-style
```powershell
.\pbj.cmd Document_Hardening
```

## Defaults (can be overridden)
- OutDir default: `C:\Projects\GreenGregoryGroupLLC\outputs`
- Bundle name: `<business>_PBJ_Test_<PASS|FAIL|HOLD>_<YYYYMMDD>_bundle.zip`

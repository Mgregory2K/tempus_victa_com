# Unified Dashboard Lite — v2 (udl_v2)

UI-first rebuild. The shell is the product; modules come later.

## Run (Windows PowerShell)
```powershell
cd .\udl_v2
.\scripts\run_dev.ps1
```
Then open:
- Local: http://127.0.0.1:9110/ui/shell/index.html
- LAN:  http://<your-laptop-ip>:9110/ui/shell/index.html

## Notes
- Data is local-first and saved on the server (future cloud migration is explicit + gated).
- Demo role is intended to store ephemeral data and purge on logout (wiring comes in Phase 3).

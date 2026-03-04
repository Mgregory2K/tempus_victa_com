@echo off
setlocal
cd /d %~dp0

echo ==================================================
echo UDL v2 - Local Launch (Per-Module Themes)
echo ==================================================
echo.

python -c "import sys; print(sys.version)" >nul 2>&1
if errorlevel 1 (
  echo Python not found. Install Python 3.11+ and re-run.
  pause
  exit /b 1
)

if not exist .venv (
  echo Creating virtual environment...
  python -m venv .venv
)

call .venv\Scripts\activate.bat
echo Installing requirements (first run may take a minute)...
pip -q install -r server\requirements.txt

set LANIP=
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.40.*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1 -ExpandProperty IPAddress)"`) do set LANIP=%%i
if "%LANIP%"=="" set LANIP=127.0.0.1

echo Starting server on http://%LANIP%:9110/ui/shell/index.html
echo (Local also works: http://127.0.0.1:9110/ui/shell/index.html)
start "" http://%LANIP%:9110/ui/shell/index.html

python -m uvicorn server.app:app --host 0.0.0.0 --port 9110

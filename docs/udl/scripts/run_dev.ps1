# UDL v2 - Dev runner (Windows PowerShell)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $here "..")

if (!(Test-Path ".venv")) {
  python -m venv .venv
}

.\.venv\Scripts\python -m pip install -r .\server\requirements.txt
.\.venv\Scripts\python -m uvicorn server.app:app --host 0.0.0.0 --port 9110

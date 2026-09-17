# PowerShell Launcher for GitHub Profile Inspector
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  GitHub Profile Inspector - Environment & Launcher" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$VenvPython = Join-Path $ScriptDir ".venv\Scripts\python.exe"

if (Test-Path $VenvPython) {
    Write-Host "[OK] Using Python virtual environment (.venv)..." -ForegroundColor Green
    & $VenvPython server.py @args
} else {
    Write-Host "[!] Virtual environment not found. Using uv run..." -ForegroundColor Yellow
    uv run python server.py @args
}

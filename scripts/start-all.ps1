# Opens backend, frontend and both Python bots, each in its own PowerShell window.
# Each bot uses its own .venv; run setup once first (see README).
$root = Split-Path -Parent $PSScriptRoot

function Start-Pane($title, $dir, $command) {
    if (-not (Test-Path $dir)) { Write-Warning "$title - $dir not found, skipped"; return }
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "`$host.UI.RawUI.WindowTitle = '$title'; Set-Location '$dir'; $command"
    )
    Write-Host "started $title"
}

Start-Pane "AROGYINI backend :3000"  "$root\backend"      "npm run dev"
Start-Pane "AROGYINI frontend :5173" "$root\frontend"     "npm run dev"

$medVenv = "$root\bots\medical\.venv\Scripts\python.exe"
if (Test-Path $medVenv) {
    Start-Pane "medical bot :5000" "$root\bots\medical" ".\.venv\Scripts\python.exe app.py"
} else {
    Write-Warning "medical bot - .venv missing, run: cd bots\medical; python -m venv .venv; .\.venv\Scripts\pip install -r requirements.txt"
}

$legalVenv = "$root\bots\legal\.venv\Scripts\python.exe"
if (Test-Path $legalVenv) {
    Start-Pane "legal bot :8002" "$root\bots\legal" ".\.venv\Scripts\python.exe server.py"
} else {
    Write-Warning "legal bot - .venv missing, run: cd bots\legal; python -m venv .venv; .\.venv\Scripts\pip install -r requirements.txt"
}

Write-Host ""
Write-Host "backend  http://localhost:3000/api"
Write-Host "frontend http://localhost:5173"
Write-Host "medical  http://localhost:5000/health"
Write-Host "legal    http://localhost:8002/health"

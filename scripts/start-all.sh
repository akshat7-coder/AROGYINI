#!/usr/bin/env bash
# Opens backend, frontend and both Python bots, each in its own terminal window.
# Each bot uses its own .venv; run setup once first (see README).
set -u
root="$(cd "$(dirname "$0")/.." && pwd)"

# Git Bash / MSYS on Windows has none of the terminal emulators below, so hand over to
# the PowerShell script, which opens a real window per service.
case "$(uname -s 2>/dev/null)" in
  MINGW* | MSYS* | CYGWIN*)
    ps1="$root/scripts/start-all.ps1"
    command -v cygpath >/dev/null 2>&1 && ps1="$(cygpath -w "$ps1")"
    exec powershell -NoProfile -ExecutionPolicy Bypass -File "$ps1"
    ;;
esac

open_pane() {  # title, dir, command
  local title="$1" dir="$2" cmd="$3"
  if [ ! -d "$dir" ]; then echo "skip $title: $dir not found" >&2; return; fi
  if command -v gnome-terminal >/dev/null 2>&1; then
    gnome-terminal --title="$title" --working-directory="$dir" -- bash -c "$cmd; exec bash"
  elif command -v konsole >/dev/null 2>&1; then
    konsole --new-tab -p "tabtitle=$title" --workdir "$dir" -e bash -c "$cmd; exec bash"
  elif command -v osascript >/dev/null 2>&1; then
    osascript -e "tell app \"Terminal\" to do script \"cd '$dir' && $cmd\"" >/dev/null
  elif command -v xterm >/dev/null 2>&1; then
    xterm -T "$title" -e bash -c "cd '$dir' && $cmd; exec bash" &
  else
    echo "No known terminal emulator. Run by hand: cd $dir && $cmd" >&2
    return
  fi
  echo "started $title"
}

open_pane "AROGYINI backend :3000"  "$root/backend"  "npm run dev"
open_pane "AROGYINI frontend :5173" "$root/frontend" "npm run dev"

for bot in "medical:5000:app.py" "legal:8002:server.py"; do
  name="${bot%%:*}"; rest="${bot#*:}"; port="${rest%%:*}"; entry="${rest#*:}"
  dir="$root/bots/$name"
  if [ -x "$dir/.venv/bin/python" ]; then
    open_pane "$name bot :$port" "$dir" ".venv/bin/python $entry"
  else
    echo "skip $name bot: no .venv. Run: cd bots/$name && python -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  fi
done

echo
echo "backend  http://localhost:3000/api"
echo "frontend http://localhost:5173"
echo "medical  http://localhost:5000/health"
echo "legal    http://localhost:8002/health"

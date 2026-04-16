#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT_DIR/.beta/server.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "No running Golf Swing beta server found."
  exit 0
fi

PID="$(cat "$PID_FILE" 2>/dev/null || true)"

if [ -n "${PID:-}" ] && kill -0 "$PID" >/dev/null 2>&1; then
  kill "$PID"
  echo "Stopped Golf Swing beta server ($PID)."
else
  echo "Golf Swing beta server was not running."
fi

rm -f "$PID_FILE"

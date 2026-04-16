#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.beta"
PID_FILE="$STATE_DIR/server.pid"
LOG_FILE="$STATE_DIR/server.log"
PORT="${PORT:-3000}"
APP_HOST="${APP_HOST:-127.0.0.1}"
APP_URL="http://$APP_HOST:$PORT"
AUTO_OPEN="${AUTO_OPEN:-1}"

mkdir -p "$STATE_DIR"

cd "$ROOT_DIR"
NEXT_BIN="$ROOT_DIR/node_modules/.bin/next"

echo "Starting Golf Swing beta from $ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install Node.js LTS first."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not available. Reinstall Node.js."
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is not installed. Install it with: brew install ffmpeg"
  exit 1
fi

if [ ! -f "$ROOT_DIR/.env.local" ]; then
  echo ".env.local is missing. Copy .env.example and add the required values first."
  exit 1
fi

if [ -f "$PID_FILE" ]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "${OLD_PID:-}" ] && kill -0 "$OLD_PID" >/dev/null 2>&1; then
    echo "Golf Swing beta is already running at $APP_URL"
    if [ "$AUTO_OPEN" = "1" ] && command -v open >/dev/null 2>&1; then
      open "$APP_URL"
    else
      echo "Open $APP_URL in your browser."
    fi
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -x "$NEXT_BIN" ]; then
  echo "Next.js binary is missing. Run npm install first."
  exit 1
fi

echo "Checking environment..."
npm run check:env

echo "Building app..."
npm run build

echo "Starting server on $APP_URL"
"$NEXT_BIN" start --hostname "$APP_HOST" --port "$PORT" >"$LOG_FILE" 2>&1 < /dev/null &
SERVER_PID=$!
disown "$SERVER_PID" 2>/dev/null || true
echo "$SERVER_PID" >"$PID_FILE"

for _ in {1..30}; do
  if curl -sf "$APP_URL" >/dev/null 2>&1; then
    echo "Golf Swing beta is ready."
    if [ "$AUTO_OPEN" = "1" ] && command -v open >/dev/null 2>&1; then
      open "$APP_URL"
    else
      echo "Open $APP_URL in your browser."
    fi
    exit 0
  fi
  sleep 1
done

echo "Server did not become ready in time. Check $LOG_FILE"
exit 1

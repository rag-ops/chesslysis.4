#!/bin/sh
set -u
PORT="${PORT:-10000}"
export PORT

if [ "${RUN_DB_PUSH_ON_STARTUP:-false}" = "true" ] && [ -n "${DATABASE_URL:-}" ]; then
  echo "[startup] Applying Prisma schema..."
  if ! npx prisma db push --skip-generate; then
    echo "[startup] FATAL: Prisma schema sync failed" >&2
    exit 1
  fi
else
  echo "[startup] Skipping runtime Prisma schema push (RUN_DB_PUSH_ON_STARTUP=${RUN_DB_PUSH_ON_STARTUP:-false})"
fi

if command -v stockfish >/dev/null 2>&1; then
  STOCKFISH_BIN="$(command -v stockfish)"
elif [ -x "${STOCKFISH_PATH:-/usr/games/stockfish}" ]; then
  STOCKFISH_BIN="${STOCKFISH_PATH:-/usr/games/stockfish}"
else
  echo "[startup] FATAL: Stockfish executable not found" >&2
  exit 1
fi
export STOCKFISH_PATH="$STOCKFISH_BIN"
echo "[startup] Stockfish: $STOCKFISH_PATH"

echo "[startup] Starting Next.js server..."
node server.js > /tmp/chesslysis-server.log 2>&1 &
SERVER_PID=$!

healthy=0
for i in $(seq 1 90); do
  if node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then healthy=1; break; fi
  sleep 1
done
if [ "$healthy" -ne 1 ]; then
  echo "[startup] FATAL: Next.js server did not become healthy" >&2
  cat /tmp/chesslysis-server.log >&2 || true
  kill "$SERVER_PID" 2>/dev/null || true
  exit 1
fi

echo "[startup] Next.js healthy on port $PORT"

WORKER_PID=""
start_worker() {
  if [ "${ANALYSIS_WORKER_ENABLED:-true}" = "true" ]; then
    echo "[startup] Starting analysis worker..."
    node worker.js > /tmp/chesslysis-worker.log 2>&1 &
    WORKER_PID=$!
    echo "[startup] Analysis worker PID $WORKER_PID"
  else
    echo "[startup] Analysis worker disabled"
  fi
}
start_worker

shutdown() {
  echo "[startup] Shutting down Chesslysis..."
  [ -n "$WORKER_PID" ] && kill "$WORKER_PID" 2>/dev/null || true
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap shutdown INT TERM

while kill -0 "$SERVER_PID" 2>/dev/null; do
  if [ "${ANALYSIS_WORKER_ENABLED:-true}" = "true" ] && [ -n "$WORKER_PID" ] && ! kill -0 "$WORKER_PID" 2>/dev/null; then
    echo "[startup] Worker exited; restarting..."
    cat /tmp/chesslysis-worker.log >&2 || true
    start_worker
  fi
  sleep 5
done

echo "[startup] Next.js exited unexpectedly" >&2
cat /tmp/chesslysis-server.log >&2 || true
exit 1

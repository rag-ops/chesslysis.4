#!/bin/sh
# Chesslysis production bootstrap.
# Keep startup failures visible: Render previously only showed "Exited with status 1".
set -u

log() { printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"; }

if [ "${RUN_DB_PUSH_ON_STARTUP:-false}" = "true" ]; then
  if [ -z "${DATABASE_URL:-}" ]; then
    log "FATAL: RUN_DB_PUSH_ON_STARTUP=true but DATABASE_URL is empty"
    exit 1
  fi
  log "Applying Prisma schema..."
  if ! npx prisma db push --skip-generate; then
    log "FATAL: Prisma schema sync failed"
    exit 1
  fi
else
  log "Skipping runtime prisma db push (set RUN_DB_PUSH_ON_STARTUP=true only when intentionally syncing schema)."
fi

log "Starting Next.js standalone server on port ${PORT:-10000}..."
node server.js &
SERVER_PID=$!

ready=false
for i in $(seq 1 90); do
  if node -e "fetch('http://127.0.0.1:'+(process.env.PORT||10000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    ready=true
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    log "FATAL: Next server exited before becoming healthy"
    wait "$SERVER_PID" || true
    exit 1
  fi
  sleep 1
done

if [ "$ready" != "true" ]; then
  log "FATAL: Web server did not become healthy within 90 seconds"
  kill "$SERVER_PID" 2>/dev/null || true
  exit 1
fi
log "Web server healthy."

WORKER_PID=""
start_worker() {
  if [ "${ANALYSIS_WORKER_ENABLED:-true}" = "false" ]; then
    log "Analysis worker explicitly disabled."
    return 0
  fi
  node worker.js &
  WORKER_PID=$!
  log "Analysis worker started with PID $WORKER_PID"
}
start_worker

(
  while true; do
    sleep 10
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      log "Web server exited; shutting down watchdog."
      exit 0
    fi
    if [ -n "$WORKER_PID" ] && ! kill -0 "$WORKER_PID" 2>/dev/null; then
      log "Analysis worker exited; restarting..."
      start_worker
    fi
  done
) & WATCHDOG_PID=$!

shutdown() {
  log "Received shutdown signal."
  [ -n "$WORKER_PID" ] && kill "$WORKER_PID" 2>/dev/null || true
  kill "$WATCHDOG_PID" 2>/dev/null || true
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap shutdown INT TERM
wait "$SERVER_PID"

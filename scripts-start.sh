#!/bin/sh
# Chesslysis production bootstrap. The Next.js server stays the main process;
# worker-supervisor.js manages the analysis worker as an independent child.
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
  log "Skipping runtime prisma db push."
fi

PORT_VALUE=${PORT:-10000}
export PORT="$PORT_VALUE"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"

log "Starting Next.js standalone server on ${HOSTNAME}:${PORT_VALUE}..."
node server.js &
SERVER_PID=$!

ready=false
for i in $(seq 1 90); do
  if node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    ready=true
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    log "FATAL: Next.js server exited before becoming healthy"
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

if [ "${ANALYSIS_WORKER_ENABLED:-true}" = "false" ]; then
  log "Analysis worker explicitly disabled."
  WORKER_SUPERVISOR_PID=""
else
  node worker-supervisor.js &
  WORKER_SUPERVISOR_PID=$!
  log "Analysis worker supervisor started with PID $WORKER_SUPERVISOR_PID"
fi

shutdown() {
  log "Received shutdown signal."
  [ -n "${WORKER_SUPERVISOR_PID:-}" ] && kill "$WORKER_SUPERVISOR_PID" 2>/dev/null || true
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap shutdown INT TERM

wait "$SERVER_PID"

# Render deployment checklist

## Required environment variables

Only one variable is required for a normal deployment:

- `DATABASE_URL` — the full PostgreSQL connection string from your Render Postgres instance.

Recommended variables:

- `ANALYSIS_WORKER_TOKEN` — any long random string. If omitted, the worker still works through a loopback-only internal endpoint.
- `ANALYSIS_WORKER_ENABLED=true`
- `RUN_DB_PUSH_ON_STARTUP=false` — recommended when the database schema already exists.

Do **not** manually set `PORT` unless your platform requires it. Render supplies its own port for native services; this Docker image also defaults to 10000.

## If deployment fails

The startup logs should now explicitly show one of:

- `FATAL: Prisma schema sync failed`
- `FATAL: Next server exited before becoming healthy`
- `FATAL: Web server did not become healthy within 90 seconds`

The health endpoint reports worker heartbeat and Stockfish availability:

`/api/health`

## Analysis queue

After clicking Analyze, a healthy worker should move games from `QUEUED` to `RUNNING` and then `COMPLETED`/`FAILED`. The worker writes a heartbeat every polling cycle and is restarted by the watchdog if its process exits.

# Phase 4 stabilization release

## What was fixed
- Background worker now has bounded request timeouts, a heartbeat, restart watchdog and queue diagnostics.
- Stockfish lifecycle was hardened: explicit process-exit detection, initialization failure handling, per-position wall-clock budgets and forced cleanup after a timeout.
- Stale RUNNING claims recover automatically after a configurable timeout instead of leaving the queue permanently wedged after a crash/deploy.
- Dashboard surfaces the latest worker error instead of showing an endless generic spinner.
- Exact time controls are now separated in addition to broad Bullet/Blitz/Rapid categories (for example 10 min, 15 min, 3 min, 3+2, 5 min, 1 min, 2 min and 2+1).
- A conservative geometry-based tactical tagger now records detected forks, pins/skewers and direct major-piece attacks in move explanations; recurring-mistake aggregation recognizes those tags.

## Production verification checklist
1. `GET /api/health` must show `stockfish.available: true` and `worker.configured: true`.
2. Start a Quick batch and watch completed/remaining change within a few minutes.
3. If it does not progress, open `/api/players/<username>/analysis-diagnostics` and inspect item attempts/error/start time.
4. Confirm a browser refresh does not alter the queue; the worker is a separate Node process.
5. After completion, dashboard metrics, insights and exact time-control tables should populate from persisted DB results.

## Important deployment variables
`DATABASE_URL`, `ANALYSIS_WORKER_TOKEN`, `ANALYSIS_WORKER_ENABLED=true`, and optionally `ANALYSIS_STALE_AFTER_MS=300000`.

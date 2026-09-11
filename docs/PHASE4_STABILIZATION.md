# Phase 4 Stabilization Notes

## What was fixed
- The analysis worker now waits for Next.js health before polling jobs.
- Missing worker configuration is logged explicitly instead of silently leaving jobs queued.
- Worker requests have bounded timeouts, exponential retry logging, and a filesystem heartbeat.
- `/api/health` reports Stockfish availability and whether the worker has recently emitted a heartbeat.
- Stockfish analysis now uses a per-position wall-clock budget in addition to requested depth. This prevents one pathological position from consuming the full request lifetime.
- Worker startup includes a watchdog restart path.

## Expected production verification
1. Open `/api/health`: `stockfish.available` must be true and `worker.alive` must become true shortly after boot.
2. Create a Quick job for one game first. It should transition `QUEUED -> RUNNING -> COMPLETED/FAILED` without a browser tab remaining open.
3. If it fails, inspect `job.lastError` and Render logs. A failure must now decrement `remaining` rather than leave a permanently stuck item.
4. Only then test five-game batches and deeper profiles.

## Important hosting limitation
A worker inside a Render free web service is still subject to service spin-down rules. The durable queue survives restarts, but uninterrupted background execution cannot be guaranteed after a free instance sleeps. For production-grade "continue after closing the browser for arbitrary time" semantics, run the worker on an always-on worker service/paid instance or another always-on compute process.

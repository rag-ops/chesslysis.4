# Chesslysis Phase 4 — Production Analysis Queue

## Goal
Phase 4 makes Stockfish analysis resumable and observable instead of coupling five complete games to one browser request.

## What changed

### Analysis profiles
- **Quick**: depth 10, optimized for first-pass coverage.
- **Standard**: depth 14, balanced detail and time.
- **Deep**: depth 18, slower but richer tactical evaluation.

### Durable job state
Analysis jobs are stored in PostgreSQL with:
- requested/completed/failed/remaining counts
- current game ID
- profile and depth
- cancellation state
- last error
- lifecycle timestamps

### Request-driven worker
The current Render deployment does not assume Redis, a paid worker, or a long-lived background daemon. A queue job processes **one game per worker request**. The dashboard chains worker requests while open, which gives each game its own bounded server execution window.

This design is intentionally safer than a single five-game request on constrained hosting:

1. Create job.
2. Mark selected games `QUEUED`.
3. Process one game with Stockfish.
4. Persist its game statistics and status.
5. Persist job progress.
6. Request the next unit.
7. Refresh dashboard when terminal.

If a browser closes, completed work is already durable. Starting a new job recovers unclaimed queued games.

## API
- `GET/POST /api/players/[username]/analysis-queue`
- `POST /api/analysis-jobs/[jobId]/process`
- `POST /api/analysis-jobs/[jobId]/cancel`
- `GET /api/players/[username]/analysis-status`

## Deployment
No manual migration command is required for the supplied Docker deployment. `scripts-start.sh` runs `prisma db push --skip-generate` when `DATABASE_URL` is configured.

## Next production evolution
A later phase can swap the request-driven worker for a dedicated Redis/worker queue without changing dashboard job semantics.

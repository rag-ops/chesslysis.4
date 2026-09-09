# Chesslysis Phase 4 Final Stabilization

## Goal
Freeze feature expansion and make Phases 1-4 production-safe before Phase 5.

## Queue architecture

User -> POST analysis job -> PostgreSQL `AnalysisJob` + `AnalysisJobItem`

Worker loop -> internal authenticated endpoint -> atomically claims one queued item -> Stockfish -> persists move/statistics -> updates job counters.

The browser only creates jobs and polls status. It is not responsible for processing games.

## Resilience guarantees
- One active job per player.
- A game belongs to a durable job item.
- Atomic item claims prevent duplicate concurrent processing.
- Stale RUNNING claims are recovered after a configurable timeout.
- Completed games remain persisted across refreshes and deploys.
- Cancel releases queued work without deleting completed analysis.
- Individual game failures are recorded and do not stop the rest of the queue.

## Deployment requirements
- `DATABASE_URL`
- `ANALYSIS_WORKER_TOKEN` (Render can generate this from render.yaml)
- Stockfish is installed in the production image at `/usr/games/stockfish`.

## Acceptance checklist
1. CI: typecheck, tests, production build.
2. Docker image builds successfully.
3. `/api/health` responds.
4. Valid Chess.com username imports real games.
5. Dashboard never fabricates accuracy for unanalyzed games.
6. Start analysis, refresh/close the page, and verify job continues.
7. Cancel a queue and verify completed games remain completed.
8. Restart deployment and verify stale claims recover.

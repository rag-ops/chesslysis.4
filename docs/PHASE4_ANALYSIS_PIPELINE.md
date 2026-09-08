# Phase 4 — Analysis Pipeline Foundation

Phase 4 begins by turning analysis from a hidden server action into an observable product pipeline.

## Added foundation
- `GET /api/players/[username]/analysis-status` exposes total, completed, pending, analyzing, failed and coverage values.
- Dashboard batch analysis reports partial success instead of treating every batch as all-or-nothing.
- The dashboard communicates that analysis continues across batches and never fabricates metrics before completion.
- Per-game analysis state is visible in the recent-games table.

## Next Phase 4 increments
1. background job persistence / queue worker,
2. real progress polling,
3. configurable quality profiles,
4. cancellation and resume,
5. analysis history and engine metadata.

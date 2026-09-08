# Phase 3.3 — Data Health Center

Phase 3.3 adds an explicit reliability surface for real player data.

- `GET /api/players/[username]/data-health` reports imported-game count, completed analysis count and pending analysis.
- The response exposes analysis coverage and the real imported game window.
- `/data-health/[username]` renders those values without demo fallbacks or fabricated engine metrics.
- Client data fetches use explicit generic response types and payload callbacks, preventing React state setter signatures from being incorrectly passed to `Promise.then`.

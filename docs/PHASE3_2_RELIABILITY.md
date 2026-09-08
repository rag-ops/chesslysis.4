# Chesslysis Phase 3.2 — Reliability Hardening

This phase focuses on production correctness rather than fabricated dashboard output.

## Fixed from Phase 3.1
- Rewrote `lib/db/performance.ts`; the invalid mixed declaration that caused the Render build failure is removed.
- Performance buckets now use explicit types and deterministic ordering.
- Opponent rating is calculated from the opponent's rating, not the player's own rating.
- Unknown game results are handled safely instead of accidentally being counted as wins/losses.

## Real-data import hardening
- Chess.com usernames are validated in one shared module.
- Imports preflight the public Chess.com profile and use Chess.com's canonical username casing in the database.
- Entering the same username with different letter casing no longer creates duplicate player identities.
- Empty, malformed, non-JSON and timeout responses continue to surface as explicit API errors.

## API hardening
- Sync validates usernames before contacting external services.
- Invalid JSON bodies fall back safely.
- `maxGames`, analysis `limit`, and analysis `depth` reject `NaN` and non-finite values.
- Sync errors expose stable machine-readable error codes.

## Production invariant
No production route imports demo fixtures. The production flow remains:

`username -> Chess.com public API -> PostgreSQL -> Stockfish analysis -> dashboard/intelligence APIs`

Demo fixtures remain test-only legacy data and are not used as a production fallback.

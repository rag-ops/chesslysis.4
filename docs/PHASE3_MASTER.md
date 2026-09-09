# Chesslysis Master Build — Phase 3 Foundation

## Critical production fixes
- Removed all production demo fallbacks and home-page demo navigation.
- `/dashboard/[username]` now attempts real import when the player is absent.
- Added safe JSON parsing so empty/non-JSON HTTP responses cannot trigger `Unexpected end of JSON input`.
- Chess.com API calls now use timeout, HTTP status handling and safe JSON parsing.
- API routes consistently return JSON error payloads with machine-readable codes.
- Docker startup ensures the Prisma schema exists before Next.js starts.
- Render port is configured for `10000` and `0.0.0.0`.

## Phase 3.1
Added Performance Intelligence:
- color performance
- time-control performance
- monthly trends
- analyzed accuracy where available
- explicit `Not analyzed` states instead of fabricated metrics

## Real-data contract
The production path is always:
username -> Chess.com public API -> import -> PostgreSQL -> analytics.
`demo` is no longer a privileged username. Existing `lib/demo` fixtures are retained only as legacy test fixtures and are not imported by production routes/components.

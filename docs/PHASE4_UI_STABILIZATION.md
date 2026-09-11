# Phase 4 UI Stabilization

This release keeps the Moonchild-inspired warm editorial visual language across the whole product.

## Stabilized
- Single, deterministic light theme; stale `dark` classes cannot alter the product.
- `/analyze` route restored so Import PGN links resolve.
- Dashboard and intelligence surfaces inherit the same light product tokens.
- Chess.com opening URLs are converted to human-readable opening names.
- Imported PGNs now persist `Opening` and `ECO` headers when available.
- Time controls use explicit Bullet (<=2 min), Blitz (3-9 min), Rapid (>=10 min), Daily buckets.
- Average accuracy and ACPL remain unavailable until real engine analysis exists; no fake zero metrics.
- Win rate remains based on all imported real games, independent of engine analysis.

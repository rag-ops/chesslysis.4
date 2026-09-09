# Phase 4 UI Integration Release

This release preserves the existing Chesslysis product architecture and applies the supplied editorial UI reference as a presentation layer.

## Preserved functionality

- Chess.com username lookup and canonical profile resolution
- Multi-game archive discovery, import and deduplication
- PostgreSQL persistence through Prisma
- Stockfish-backed analysis and move classification
- Durable analysis queue and background worker
- Progress, cancellation and stale-work recovery
- Dashboard, insights, recurring mistakes, training, openings, time-control intelligence, DNA and data health
- Interactive game inspector and direct game review
- Single-PGN validation and analysis

## UI integration

The reference visual language is translated into the production AppShell, page background, cards, typography, actions and review workspace. The prototype's data is not copied into production routes.

## Chessboard alignment

Game Review uses a mathematically rigid 8x8 CSS grid and a consistent inline SVG renderer for all chess pieces. Pieces are centered inside each square independently of font metrics, avoiding Unicode-glyph baseline drift.

## Time controls

The existing time-control taxonomy continues to preserve exact controls underneath broad categories:

- Bullet: 1+0, 2+0, 2+1 and similar
- Blitz: 3+0, 3+2, 5+0, 5+3 and similar
- Rapid: 10+0, 10+5, 15+0, 15+10, 30+0 and similar
- Daily/Unknown remain explicit

## CI and deployment

The CI workflow runs typecheck, tests, production build, Docker build and a production container health smoke test. The Docker entrypoint verifies Stockfish and waits for the Next.js health endpoint before starting the analysis worker.

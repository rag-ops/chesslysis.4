# Chesslysis UI stabilization

The product UI now uses a consistent editorial chess-intelligence system across feature pages while preserving the existing API/data contracts.

## Design rules
- Warm editorial surfaces instead of generic blue/purple AI gradients.
- Charcoal fixed navigation with green active state.
- Dense, readable analytics with clear hierarchy and restrained shadows.
- Light/dark theme toggle persisted in localStorage.
- Responsive bottom navigation on small screens.
- Existing feature logic, API calls, engine analysis, queue behavior, and test contracts remain unchanged.

## Regression checklist
- Homepage remains unchanged in behavior and visual direction.
- `/analyze` keeps PGN paste/upload/example flows and validation states.
- Player pages keep their existing API endpoints and data-driven states.
- `/games/[gameId]` and `/inspector/[username]` keep board/review behavior.
- No proprietary Chess.com board/piece assets are introduced.
- Run lint, typecheck, unit tests, and production build before deployment.

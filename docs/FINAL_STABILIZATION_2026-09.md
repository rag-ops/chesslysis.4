# Chesslysis final stabilization pass — September 2026

## Engine correctness

- Stockfish UCI `cp` and `mate` scores are normalized at the engine boundary to a consistent White-perspective representation.
- Mate scores are represented with an explicit `mate` field and a finite ±10-pawn visual/metric cap; raw values such as `100000` or `1000000` cannot enter ACPL or accuracy calculations.
- A legal played move that is the engine's exact UCI best move receives zero evaluation loss even when it delivers mate.
- A move that is checkmate is recognized from the resulting FEN with `chess.js`, so a real `Rb8#` cannot be misclassified merely because SAN disambiguation differs from an engine UCI string.
- The engine's UCI best move is converted to SAN from the exact pre-move FEN for user-facing display.
- Existing persisted aggregates above the safety threshold are treated as invalid in dashboard/review/opening/time/performance views until the game is freshly re-analyzed.

## Review UX

- Evaluation bar is horizontal and directly above the board.
- Move navigation is sticky and stays near the top of the review surface.
- Desktop move list, board, and analysis panel remain independently usable while scrolling.
- Engine evaluations and graphs are visually bounded so mate sentinels cannot create enormous graph spikes.
- Best continuations are shown in SAN, with UCI retained only as secondary diagnostic text.

## Opening UX/data

- Chess.com opening URLs are normalized to readable opening names.
- Insights and Opening Intelligence use the same opening-label normalization helper.

## Regression coverage

The pass adds/updates contracts for:

- White/Black UCI score normalization
- finite mate representation
- bounded evaluation loss
- exact UCI → SAN conversion
- checkmate-side semantics
- URL → opening-name normalization

The local environment used for this packaging pass did not have a complete installed dependency tree, so a full `npm run verify` / Docker build could not be honestly claimed here. The repository CI remains the authoritative production verification path.

## CI regression fixes

The final regression pass also corrects three concrete CI issues found after the engine/UI stabilization work:

- Chess.com opening slugs such as `Queen-s-Gambit-Declined` are rendered as `Queen's Gambit Declined`, not `Queen S Gambit Declined`.
- The SAN regression uses a position where `Rb8` is genuinely checkmate, so the expected SAN is `Rb8#`, not `Rb8+`.
- `InspectorClient` types now match the review API's `fenBefore`, `mate`, and `bestMoveSan` fields.

These are contract fixes rather than weakening tests: the implementation and test expectations now describe the same legal chess position and API shape.

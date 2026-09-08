# Fixes applied by Claude — 2026-09-04

Base: `chesslysis-phase4-error-free-stabilized.zip`. This document lists exactly
what changed, why, and — importantly — what I could **not** verify by actually
running the code (I have no network access in this environment, so `npm install`,
`tsc`, `vitest`, and `docker build` were not executed here). Run `npm run verify`
locally before deploying.

## 1. Fixed: light-theme remnants (4 files)

`bg-white` / `text-slate-900` / `bg-slate-50` panels rendered near-invisible
light-gray-on-white text against this app's dark body background. Converted to
the dark card style already used elsewhere in the app
(`border-white/10 bg-[#0d1320] shadow-2xl shadow-black/20`):

- `components/chessboard/GameReviewBoard.tsx` — the two Game Review side panels
- `components/insights/PhasePerformance.tsx`
- `components/insights/InsightTable.tsx`
- `components/home/PlayerSearch.tsx` — the homepage username input/button
  (the first thing every visitor sees/uses)

## 2. Fixed: pin/skewer mislabeling bug in `lib/analysis/patterns.ts`

The geometric pin/skewer check only ever compared "is the piece behind `first`
worth more?" — which is the definition of a **pin**, not a skewer. It labeled
that same case "skewer" whenever the piece behind wasn't the king, so real pins
(non-absolute ones) were reported as skewers, and true skewers (front piece
worth *more* than what's behind it) were never detected at all.

Fixed so:
- **pin** = piece behind `first` is the king, or worth more than `first`
- **skewer** = `first` itself is worth more than the piece behind it

Added two regression tests (`tests/patterns.test.ts`) with hand-verified FEN
positions covering each case explicitly, so this can't silently regress again.

## 3. Added: mate-in-1 threat detection

`patterns.ts` previously only looked at fork/pin/skewer geometry from the piece
that just moved. It now also flags `"allows mate in 1"` when the move leaves the
opponent with a legal checkmating reply. This delegates entirely to `chess.js`'s
own move generator and `isCheckmate()` rather than hand-rolled check logic, since
that's the part I'm least able to verify by hand-tracing — chess.js is a
well-tested library, my own geometry code is not. Added a dedicated test with a
hand-verified back-rank mate position.

## 4. Not fixed here: missing `package-lock.json`

I don't have network access in this sandbox, so I can't run `npm install`
against the real npm registry to generate a valid lockfile — and I won't
fabricate one with fake integrity hashes, since that would make `npm ci` fail
outright. **This needs to happen on your machine (or in CI with network access):**

```bash
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
```

Once that's committed, switch both of these from `npm install` to `npm ci`
for reproducible builds:
- `Dockerfile`: `RUN npm install --no-audit --no-fund` → `RUN npm ci --no-audit --no-fund`
- `.github/workflows/*.yml`: same substitution wherever it installs dependencies

I deliberately left `Dockerfile`/CI on `npm install` in this delivery so the
build doesn't break the moment you deploy this zip without a lockfile yet.

## 5. Known remaining gaps (not attempted this pass)

- `tests/smoke/worker-runtime.test.ts` still just asserts that certain strings
  exist in `worker.js`/`scripts-start.sh` — it doesn't actually run the worker.
  Real integration coverage would need a live Postgres + spawned Node process.
- Tactical pattern detection covers fork/pin/skewer/mate-in-1 from the moved
  piece only. Hanging pieces, discovered attacks, and back-rank *structural*
  weakness (as opposed to an acute mate-in-1) are still not implemented.

# Chesslysis ♟️

A portfolio-grade chess analytics platform inspired by profile-level chess insights. Chesslysis imports public Chess.com games, persists them, analyzes positions with Stockfish, and turns the resulting data into player-level intelligence.

## Phase 4 — Stabilization Build

### Product capabilities

- Real Chess.com username import through the public archive API
- Game deduplication and PostgreSQL persistence
- PGN parsing into normalized move and position records
- Stockfish-backed move evaluation and classification
- Real player dashboard (not demo data for normal usernames)
- Advanced profile insights
- Recurring mistake detection
- Training recommendations
- Player DNA / playing-style signals
- Time-control performance intelligence
- Opening and repertoire intelligence
- Interactive Game Inspector with real imported games and stored engine analysis
- Demo fixtures retained only for explicit `/demo` routes
- Loading, empty, retry, 404, and controlled API error states

## Architecture

```text
Chess.com public data
        ↓
Archive discovery + game import
        ↓
PostgreSQL / Prisma
        ↓
PGN → normalized moves + FEN positions
        ↓
Stockfish analysis
        ↓
Game statistics + classifications
        ↓
Dashboard / Insights / DNA / Openings / Time / Training / Inspector
```

## Local setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 3. Start PostgreSQL and create the schema

With Docker:

```bash
docker compose up -d db
npx prisma db push
```

Or point `DATABASE_URL` at any PostgreSQL database you control and run:

```bash
npx prisma db push
```

### 4. Verify before running

```bash
npm run verify
```

This intentionally runs:

```text
TypeScript → tests → production build
```

### 5. Start the app

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Enter a public Chess.com username. Chesslysis imports real games on first dashboard access.

## Real-data flow

For a normal username:

```text
/dashboard/<username>
        ↓
Player absent locally?
        ↓
Fetch public Chess.com archives
        ↓
Import recent games
        ↓
Persist + deduplicate
        ↓
Show real dashboard statistics
        ↓
Analyze a small batch with Stockfish
        ↓
Populate engine-backed intelligence
```

Some metrics intentionally remain unavailable until Stockfish analysis exists. Chesslysis does not fabricate accuracy, ACPL, blunders, or playing-style scores.

## Important routes

- `/dashboard/[username]` — real player dashboard
- `/insights/[username]` — profile insights
- `/openings/[username]` — opening intelligence
- `/mistakes/[username]` — recurring patterns
- `/training/[username]` — training priorities
- `/dna/[username]` — player DNA
- `/time/[username]` — time-control intelligence
- `/inspector/[username]` — real interactive game inspector
- `/games/[gameId]` — direct game review
- `/api/health` — liveness endpoint

## Deployment

The Docker image uses:

- Node 22
- Next.js standalone output
- Stockfish
- OpenSSL and CA certificates for Prisma
- dynamic platform `PORT`
- `HOSTNAME=0.0.0.0`
- committed `public/.gitkeep` so Docker never fails on a missing public directory

Before a first production deployment, provision PostgreSQL and apply the Prisma schema:

```bash
npx prisma db push
```

For long-lived production environments, replace `db push` with reviewed Prisma migrations.

### Render notes

Do not hardcode a platform-specific port unless the platform explicitly requires it. The application defaults to port 3000 locally and the standalone server can consume the `PORT` supplied by the hosting platform.

Required production environment variables:

```text
DATABASE_URL=<your PostgreSQL connection string>
STOCKFISH_PATH=/usr/games/stockfish
CHESSCOM_USER_AGENT=<descriptive application identifier>
NODE_ENV=production
```

## Reliability policy

- Exact floating-point equality is avoided for calculated decimal values in tests.
- Public aggregate metrics are rounded before API/UI display.
- API routes validate usernames and return controlled errors.
- Empty datasets produce honest empty states.
- Malformed individual PGNs do not abort an entire player import.
- Engine analysis failures mark the affected game as failed instead of crashing the profile.
- No database query is required merely to compile the Next.js application.

## Master Build / Phase 3
See `docs/PHASE3_MASTER.md` for the production hardening and Phase 3.1 Performance Intelligence additions.

### Render
Set `DATABASE_URL` to a PostgreSQL connection string. The Docker entrypoint runs `prisma db push --skip-generate` before starting the standalone Next.js server, so a fresh database receives the required schema automatically.

## Phase 3.2 — Reliability Hardening

The Phase 3.2 master build adds production-focused safeguards:

- fixed the `lib/db/performance.ts` TypeScript syntax error that blocked the Render build
- canonical Chess.com username resolution before database persistence
- shared username validation across import and sync paths
- stable sync error codes and safer HTTP status mapping
- finite integer validation for sync and analysis request options
- deterministic performance aggregation with real opponent ratings

See `docs/PHASE3_2_RELIABILITY.md` for the full change list.

## Phase 3.3 — Data Health Center

Added `/data-health/[username]` and a real data-health API so users can inspect import coverage, analysis coverage, pending games and dataset dates. This phase also fixes strict TypeScript callback incompatibilities in the Opening Intelligence and Time Management clients.


## Phase 3 Final Stabilization + Phase 4 Foundation

The current master fixes the live issues found during real Render use:

- production Stockfish path is configured in Docker
- engine startup failures are explicit rather than hidden timeouts
- position evaluation caching reduces batch analysis work
- batch analysis reports partial success and retries failed games
- dashboard visuals are consistently dark and responsive on mobile
- per-game analysis state is visible
- Phase 4 starts with an observable analysis-status API

See `docs/PHASE3_FINAL_STABILIZATION.md` and `docs/PHASE4_ANALYSIS_PIPELINE.md`.


## Phase 4 analysis queue

Chesslysis now includes durable PostgreSQL-backed analysis jobs with Quick (depth 10), Standard (depth 14), and Deep (depth 18) profiles. See `docs/PHASE4_ANALYSIS_QUEUE.md`.

## Phase 4 Final stabilization
The production queue is durable and worker-driven: the browser creates/polls jobs while the server claims one persisted job item at a time. See `docs/PHASE4_FINAL_STABILIZATION.md`.

## Phase 4 operational checks

After deployment, visit `/api/health`. A production-ready instance should report Stockfish available and a configured, alive analysis worker. For a stuck queue, `/api/players/<username>/analysis-diagnostics` exposes persisted job-item status, attempts and the latest item error without requiring browser state.


## Phase 4 deployment stability notes

- The web server and analysis worker run as separate Node processes inside the same container.
- The worker no longer requires `ANALYSIS_WORKER_TOKEN` to exist: when omitted, the internal route accepts only loopback requests from the same container. A configured token remains supported and recommended.
- Runtime schema syncing is disabled by default with `RUN_DB_PUSH_ON_STARTUP=false` to prevent a transient Prisma startup failure from killing an otherwise valid deployment. Set it to `true` only when intentionally applying the schema to a new database.
- `/api/health` exposes Stockfish and worker-heartbeat status for deployment debugging.
- The startup script emits explicit fatal messages for server readiness, schema sync and worker restarts instead of a bare `Exited with status 1`.

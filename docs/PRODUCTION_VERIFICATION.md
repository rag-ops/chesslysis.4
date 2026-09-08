# Production verification gate

A release is deployable only after GitHub Actions completes:

1. `npm install --no-audit --no-fund`
2. `npx prisma generate`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`
6. `docker build`
7. production-container `/api/health` smoke test

Render then performs the actual deployment using the same Docker image family.

The production image uses Node 22, Next.js standalone output, Stockfish, OpenSSL and `HOSTNAME=0.0.0.0`.

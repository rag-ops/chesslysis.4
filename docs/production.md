# Production checklist

## Local Docker run

```bash
docker compose up --build
```

Then visit `http://localhost:3000` and `http://localhost:3000/api/health`.

## Database setup

For first-time local setup, in another terminal:

```bash
docker compose exec app npx prisma db push
```

## Common failures fixed in P1.10

- Tailwind/PostCSS dependencies are explicitly installed.
- Prisma Client is generated before `next build`.
- The production image uses Next standalone output.
- No `.env.local` is copied during the image build.
- Docker has PostgreSQL health checks.
- Stockfish is installed in the runtime image.
- Dynamic database pages are marked `force-dynamic` to prevent build-time database access.

Never commit `.env` files or production credentials.

# QuantLab

Visual, no-code trading strategy builder and backtesting platform.

## Monorepo layout

```
apps/web              React + Vite + TypeScript frontend
apps/api               Express + TypeScript backend
packages/shared-types    TypeScript types shared between web and api
packages/config           Shared tsconfig used by every workspace
prisma/                     Database schema and migrations
```

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL) — or a PostgreSQL 16 instance you already have running

## First-time setup

```bash
# 1. Install dependencies for every workspace
npm install

# 2. Start local Postgres
docker compose up -d

# 3. Copy env files and fill in values (defaults already match docker-compose.yml)
cp prisma/.env.example prisma/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Run the initial database migration
npm run db:migrate:dev

# 5. Start both the API and the web app together
npm run dev
```

- API: http://localhost:4000 (health check at `/health`)
- Web: http://localhost:5173

## Common scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Run api + web together |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint the whole repo |
| `npm run format` | Format the whole repo with Prettier |
| `npm run db:studio` | Open Prisma Studio to inspect the database |
| `npm run db:migrate:dev` | Create/apply a new migration in development |

## Continuous integration

Every push and pull request against `main` runs `.github/workflows/ci.yml`,
which spins up a throwaway Postgres 16 container (matching
`docker-compose.yml`) and then, in order: installs dependencies, generates
the Prisma client, applies migrations against it, lints, typechecks, builds,
and runs the full test suite (`packages/domain` + `apps/api`) - the same
checks in the table above, just enforced automatically instead of trusted to
run locally. A red CI run means one of those checks failed; the workflow log
shows which step and why.

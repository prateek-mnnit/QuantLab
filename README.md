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

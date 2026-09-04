# CuratedByDer

Online bookstore (books & toys) built with Next.js 16 (App Router), Prisma, and PostgreSQL on Neon. Monorepo of buyer and admin dashboards.

## Tech Stack

- Next.js 16.3.4 (App Router, Turbopack) + React 19.2.8 + TypeScript 5.9
- Tailwind CSS 3.4 + shadcn/ui (Radix)
- Prisma 6.19 + PostgreSQL on Neon
- NextAuth.js v4 (Credentials, JWT sessions, role-based proxy guards)
- Zod 4, Uploadthing (file uploads), jsPDF (order PDFs), Recharts
- Vitest 5 + Testing Library (tests/coverage), ESLint 9 (flat config), SonarQube Cloud

## Local Development

The local database is separate from production (Neon dev project vs prod project). Table structure is shared via Prisma migrations committed to git; data is never shared.

### Initial setup

1. Copy `.env.example` to `.env`, then fill in:
   - `DATABASE_URL` — Neon dev **pooled** URL (host contains `-pooler`)
   - `DIRECT_URL` — Neon dev **direct** URL (without `-pooler`), used for migrations
   - `NEXTAUTH_URL=http://localhost:3000`, `NEXTAUTH_SECRET` (any value, different from prod)
   - `UPLOADTHING_TOKEN` (separate dev app), `ADMIN_SEED="email|password|name"`
2. Apply schema + seed:

```bash
npm run db:migrate   # apply/create migrations (anti-prod guardrail active)
npm run db:seed      # create admin from ADMIN_SEED
npx tsx scripts/seed-sample-data.ts   # sample catalog data (optional)
```

### Schema change workflow

```bash
npm run db:migrate   # 1. edit prisma/schema.prisma, then create the migration
git commit           # 2. commit the generated migration files
git push             # 3. Vercel automatically runs `prisma migrate deploy` on build
```

Migrations are applied to the production DB structure on deploy — production data is untouched.

### Guardrail

`npm run db:migrate` and `npm run db:seed` refuse to run if `DATABASE_URL` points at the production database (host check in `scripts/check-db-target.mjs`). Emergency bypass: `SKIP_DB_GUARD=1`.

## Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Branching & Deployment

- `main` = production branch — merging to `main` deploys production on Vercel.
- `staging` = integration branch — feature PRs target `staging`, and every push creates a staging preview deploy (dev DB, never production data).
- Workflow: `feat/<short>` or `fix/<short>` branch → PR to `staging` → test on the staging preview → release PR `staging` → `main` (merge commit) → one production deploy for the whole batch of features.
- Hotfixes for fatal production bugs may PR straight to `main`; back-merge `main` → `staging` afterwards.
- Migrations run automatically on every Vercel build via `prisma migrate deploy`.
- Vercel env scopes: Production points at the prod DB; Preview points at the dev DB (staging) with its own `NEXTAUTH_URL` and `NEXTAUTH_SECRET`.

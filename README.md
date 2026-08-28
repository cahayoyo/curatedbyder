This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Local Development

Database lokal terpisah dari production (Neon project dev vs prod). Struktur tabel dibagikan lewat Prisma migrations yang di-commit ke git; data tidak pernah ikut.

### Setup awal

1. Copy `.env.example` ke `.env`, isi:
   - `DATABASE_URL` — Neon dev **pooled** URL (host mengandung `-pooler`)
   - `DIRECT_URL` — Neon dev **direct** URL (tanpa `-pooler`), dipakai untuk migrasi
   - `NEXTAUTH_URL=http://localhost:3000`, `NEXTAUTH_SECRET` (bebas, beda dari prod)
   - `UPLOADTHING_TOKEN` (app dev terpisah), `ADMIN_SEED="email|password|nama"`
2. Apply schema + seed:

```bash
npm run db:migrate   # apply/create migrations (guardrail anti-prod aktif)
npm run db:seed      # buat admin dari ADMIN_SEED
npx tsx scripts/seed-sample-data.ts   # data katalog contoh (opsional)
```

### Workflow perubahan schema

```bash
npm run db:migrate   # 1. ubah prisma/schema.prisma, lalu buat migration
git commit           # 2. commit file migration yang dibuat
git push             # 3. Vercel otomatis menjalankan `prisma migrate deploy` saat build
```

Migrasi diterapkan ke struktur DB prod saat deploy — data prod tidak tersentuh.

### Guardrail

`npm run db:migrate` dan `npm run db:seed` menolak jalan jika `DATABASE_URL` menunjuk ke DB production (cek host di `scripts/check-db-target.mjs`). Bypass darurat: `SKIP_DB_GUARD=1`.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

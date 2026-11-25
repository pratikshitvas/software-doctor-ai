# Database

Prisma schema: `apps/api/prisma/schema.prisma`.

1. Install PostgreSQL 14+ locally or provision a managed PostgreSQL database.
2. Copy `apps/api/.env.example` to `apps/api/.env`, set `DATABASE_URL` and a strong `JWT_ACCESS_SECRET`.
3. From the monorepo root:

```powershell
npm install
npm run db:generate
npm run db:migrate
```

The API requires a migrated database. Never commit local environment files.
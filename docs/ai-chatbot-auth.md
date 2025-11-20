# AI Chatbot Auth & Learner Provisioning

This document captures how the `apps/web` experience now supports AIVO's multi-role
chatbot workflows.

## Stack Overview

- **Next.js 14 App Router** powering landing + caregiver/learner surfaces.
- **NextAuth v5** (Credentials provider) for username/email logins.
- **Prisma + PostgreSQL** dedicated schema at `apps/web/prisma/schema.prisma` for
  `User`, `Profile`, and `Learner` records.
- **Tailwind CSS** for the onboarding UI components.

## Credential Flows

1. **Caregiver self-registration** (`POST /api/auth/register`)
   - Validates names, role (parent or teacher), and password strength with Zod.
   - Auto-generates a unique username using `lib/passwords.ts` helpers.
2. **Login** via `/login`
   - Users authenticate with either email or username through NextAuth Credentials.
   - JWT session embeds `id`, `username`, and `role` for downstream checks.
3. **Learner creation** (`POST /api/learners`)
   - Guardians create linked learners; secure passwords are generated + hashed.
   - Returns one-time credentials for the caregiver to share offline.
4. **Password reset** (`POST /api/learners/:id/reset-password`)
   - Guardians can rotate learner passwords; returns regenerated credentials.

## Middleware & Access Control

`apps/web/middleware.ts` uses `auth` from NextAuth to:

- Enforce authentication on `/dashboard` + `/learners` routes.
- Redirect learners away from guardian-only pages.
- Preserve the `callbackUrl` query so users return to their destination after login.

## Environment

Create `apps/web/.env.local` (see app README) with:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/aivo_auth
NEXTAUTH_SECRET=long-random-string
NEXTAUTH_URL=http://localhost:3000
```

Run migrations for the scoped schema:

```powershell
pnpm --filter web exec prisma migrate dev --schema prisma/schema.prisma
```

## Dev Commands

```powershell
pnpm install
pnpm --filter web exec prisma generate --schema prisma/schema.prisma
pnpm dev --filter=apps/web...
```

With the above, the chatbot onboarding flows (caregiver invite, learner provisioning,
role-aware dashboards) are ready for integration with downstream services.

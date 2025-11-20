# web – Caregiver Auth and Learner Provisioning

Next.js 14 application that now hosts AIVO's multi-role authentication, caregiver self-service
registration, and secure learner provisioning pipelines. It uses NextAuth v5 (credentials
provider), Prisma + PostgreSQL, and Tailwind for quick UI scaffolding.

## Features

- Caregiver self-registration (`/register`) with password strength checks and profile capture
- NextAuth credential login for caregivers and learners with role-aware JWT sessions
- Protected dashboard (`/dashboard`) that surfaces recent learners and quick actions
- Learner creation wizard (`/learners/new`) that generates unique usernames + high entropy passwords
- API endpoints for listing learners and rotating credentials (`/api/learners`, `/api/learners/:id/reset-password`)
- Middleware enforcement that blocks anonymous access and keeps learners out of caregiver-only flows
- AI-powered learner baseline (`/learn/assessment`) with adaptive questions across Reading, Math, Speech, SEL, and Science
- Capability reports (`/learn/assessment/results/:id`) with downloadable Markdown summaries and shareable links

## Environment

Create an `.env.local` inside `apps/web` with:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/aivo_auth"
NEXTAUTH_SECRET="generate-a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-optional-if-you-want-live-AI"
```

Run migrations for the local schema:

```powershell
pnpm --filter web exec prisma migrate dev --schema prisma/schema.prisma
```

> The baseline experience works without OpenAI (deterministic fallbacks), but setting `OPENAI_API_KEY`
> unlocks richer question phrasing and capability narratives.

## Development

```powershell
# Install deps, generate Prisma client, and start dev server
pnpm install
pnpm --filter web exec prisma generate --schema prisma/schema.prisma
pnpm dev --filter=apps/web...
```

The marketing landing page now links to login/register. After signing in, use the dashboard to
manage learner accounts and retrieve credentials when needed.

### Baseline assessment quickstart

1. Authenticate as a learner (or impersonate via the seed scripts).
2. Visit `/learn/assessment` to launch the adaptive flow. The UI now supports:
   - Automatic resume if a learner refreshes or closes the tab mid-session.
   - Audio responses, open-ended prompts, and visual supports per domain.
   - Inline error handling and retry controls when the AI question service lags.
3. Completing all five domains writes an `Assessment` record via Prisma and forwards to
   `/learn/assessment/results/:assessmentId`.
4. On the results screen you can download a Markdown report or copy/share the deep link with
   another educator.

The `/api/assessment/report/:assessmentId` endpoint powers the Markdown export if you need to call it
from another service.

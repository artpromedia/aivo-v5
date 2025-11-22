# web – Caregiver Auth and Learner Provisioning

Next.js 14 application that now hosts AIVO's multi-role authentication, caregiver self-service
registration, and secure learner provisioning pipelines. It uses NextAuth v5 (credentials
provider), Prisma + PostgreSQL, and Tailwind for quick UI scaffolding.

## Features

- Caregiver self-registration (`/register`) with password strength checks and profile capture
- NextAuth credential login for caregivers and learners with role-aware JWT sessions
- Protected dashboard (`/dashboard`) that surfaces recent learners and quick actions
- Parent command center (`/portals/parent/dashboard`) with focus insights, AI recommendations, and approval queue
- Teacher dashboard (`/portals/teacher/dashboard`) that aggregates class mastery, focus trends, and AI nudges
- Teacher accommodation workspace (`/portals/teacher/learners/:id/accommodations`) to toggle supports, auto-enable from diagnoses, and view effectiveness metrics
- Teacher curriculum editor (`/portals/teacher/content/editor`) to align standards, request AI adaptations, and monitor effectiveness metrics
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
PINECONE_API_KEY="pc-optional-if-you-want-vector-store"
PINECONE_INDEX="aivo-personalized"
AIVO_CRON_SECRET="set-this-if-you-want-to-protect-the-fine-tune-sync-endpoint"
UPSTASH_REDIS_URL="https://us1-certain-redis.upstash.io"
UPSTASH_REDIS_TOKEN="***"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
VIDEO_CONFERENCING_BASE_URL="https://meet.jit.si"
NOTIFICATION_FROM_EMAIL="AIVO Notifications <notify@aivo.local>"
```

Run migrations for the local schema (includes the new messaging, meetings, and announcement tables):

```powershell
pnpm --filter web exec prisma migrate dev --schema prisma/schema.prisma
# To apply the latest communication + analytics tables in CI/CD environments run:
pnpm --filter web exec prisma migrate deploy --schema prisma/schema.prisma
```

> The baseline experience works without OpenAI (deterministic fallbacks), but setting `OPENAI_API_KEY`
> unlocks richer question phrasing and capability narratives. Use `PINECONE_*` variables if you
> want vector embeddings for the cloned learner models (otherwise the service stores mock ids).

## Development

```powershell
# Install deps, generate Prisma client, and start dev server
pnpm install
pnpm --filter web exec prisma generate --schema prisma/schema.prisma
pnpm dev --filter=apps/web...
```

The marketing landing page now links to login/register. After signing in, use the dashboard to
manage learner accounts and retrieve credentials when needed.

### AI dashboards & realtime data

Parent and teacher dashboards now pull directly from Prisma via `/api/dashboards/*` and `/api/approvals`.
An SSE endpoint (`/api/dashboards/stream`) keeps charts, approvals, and insights synchronized across
portals without manual refreshes. The UI primitives live in `apps/web/components` if you need to extend
them.

Real-time analytics buffers use Upstash Redis. Make sure `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN`
are present in the web runtime (or the service gracefully falls back to buffered writes only).

Observability hooks powered by `@aivo/observability` trace the dashboard service calls, count pending
approvals, and emit structured logs for SSE connections plus approval decisions. You can tail the
structured JSON logs or scrape `recordMetric` output to flow these signals into your preferred APM.

### Curriculum authoring + effectiveness

1. Visit `/portals/teacher/content/editor` (teacher session required). Use the standards rail on the left to filter by subject, grade band, and jurisdiction, then select the codes you want attached to the next piece of content.
2. Create a content shell by supplying module id, title, summary, difficulty, type, and any AI tags. The UI will auto-load the new record so you can immediately iterate.
3. To resume prior work, paste an existing content id into the "Existing content ID" field and press **Load content**. The page will fetch versions, standards, and effectiveness history through `/api/curriculum/content/[contentId]?versions=1&effectiveness=1`.
4. Request AI adaptations by completing the right-hand assistant panel (audience, learner traits, goal). This calls `/api/curriculum/adapt` which delegates to `ContentAdapter` (requires `OPENAI_API_KEY`, otherwise deterministic fallbacks kick in). Publish the preferred draft to make it the active version.
5. Capture usage signals by POSTing to `/api/curriculum/interactions/log` from delivery surfaces (include interaction type, modality, duration, mastery evidence, etc.). Logged interactions are buffered by `content-effectiveness.ts` and rendered back in the editor so teachers can see hit rates, attention, and mastery lift per day.

> Tip: run `pnpm --filter web exec prisma migrate dev --schema prisma/schema.prisma` after pulling schema updates so LearningStandard, CurriculumContent, ContentVersion, and ContentEffectiveness tables stay in sync.

### Learner accommodations engine

1. Open `/portals/teacher/learners/:learnerId/accommodations` to review the active plan. The page hydrates from `/api/learners/:learnerId/accommodations` and shows recent effectiveness data (`/effectiveness`).
2. Use **Auto-enable from diagnoses** to call `/api/learners/:learnerId/accommodations/setup`, which maps the learner's diagnoses to the default accommodation set defined in `lib/accommodations/accommodation-manager.ts`.
3. Toggle accommodations with the inline controls; every change PATCHes the same endpoint and persists to `LearnerAccommodation` (Prisma table). Notes are stored alongside the plan metadata for quick context.
4. Effectiveness metrics update via `accommodationManager.trackAccommodationEffectiveness` and surface in the dashboard so teachers can see engagement/completion deltas per support.

> The new Prisma models (`LearnerAccommodation`, `AccommodationEffectiveness`) live in `apps/web/prisma/schema.prisma`. Run `pnpm --filter web exec prisma migrate dev --schema prisma/schema.prisma` after pulling to ensure your local database has the `20251121150559_add_accommodations` migration.

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

### AI model cloning & adaptive sessions

1. When an assessment is completed we enqueue `/api/ai/clone-model` with the learner's strengths,
   challenges, diagnoses, and domain levels.
2. `lib/ai/model-cloner.ts` builds a personalized system prompt, prepares OpenAI fine-tune payloads,
   and (optionally) pushes supporting context into Pinecone.
3. Personalized model metadata is stored in the `PersonalizedModel` Prisma table for reuse during
   adaptive learning sessions (`lib/ai/learning-session.ts`).
4. Cron or worker jobs can `POST /api/ai/fine-tunes/sync` (passing `x-cron-secret` when configured)
   to promote finished OpenAI fine-tunes from `TRAINING` to `ACTIVE` status or mark failures as `ERROR`.
5. Difficulty adjustments flow through `/api/approval/difficulty-change` to guarantee that a parent
   or teacher approves any level change before it updates the learner's model configuration.

> The approval route returns `PENDING_APPROVAL` on POST and expects a PATCH with `APPROVED` or
> `DECLINED`. Approved changes automatically log the decision via `LearningAdjustmentLog`.

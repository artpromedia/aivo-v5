# @aivo/persistence

Shared Prisma-based persistence layer for the AIVO v5 monorepo.

This package exposes a single Prisma client instance and a few convenience helpers for common operations on learners, brain profiles, difficulty proposals, sessions, and notifications.

## Database & migrations

The canonical Prisma schema for the monorepo lives at `prisma/schema.prisma` in the repo root. `@aivo/persistence` consumes the generated `@prisma/client` types from that schema.

### Configure your database

Set the database connection in your root `.env` file, for example:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/aivo_v5"
```

The root schema is configured for PostgreSQL by default. You can adjust the provider in `prisma/schema.prisma` if needed.

### Run migrations & generate client

From the monorepo root:

```bash
pnpm prisma:migrate
pnpm prisma:generate
```

These commands will:

- Apply pending Prisma migrations to your database.
- Generate the `@prisma/client` package used by `@aivo/persistence`.

If you prefer to scope commands to this workspace, you can also run:

```bash
pnpm --filter @aivo/persistence prisma:generate
```

## Seeding tenants and users

For local development, there is a seed script at `scripts/seed-tenants-and-users.ts` that inserts demo tenants and users matching the mock auth IDs used by `services/api-gateway`.

From the repo root:

```bash
pnpm seed
```

This will:

- Upsert demo tenants like `tenant-1` and `platform-tenant`.
- Upsert users like `user-parent-1`, `user-teacher-1`, `user-district-admin`, and `user-platform-admin`.

These IDs align with `getMockUserFromHeader` in `services/api-gateway/src/authContext.ts`, so notification and proposal flows can safely rely on real rows in the database.

## Using the helpers

In a service, import the helpers from `@aivo/persistence`:

```ts
import {
  prisma,
  getLearnerWithBrainProfile,
  upsertBrainProfile,
  createDifficultyProposal,
  listPendingProposalsForLearner,
  decideOnProposal,
  createNotification,
  listNotificationsForUser,
  markNotificationRead
} from "@aivo/persistence";
```

### Examples

Fetch a learner with their brain profile:

```ts
const learner = await getLearnerWithBrainProfile("demo-learner");
```

Create a difficulty proposal and corresponding notification:

```ts
const proposal = await createDifficultyProposal({
  learnerId: "demo-learner",
  tenantId: "tenant-1",
  subject: "math",
  fromLevel: 5,
  toLevel: 6,
  direction: "harder",
  rationale: "Learner shows strong mastery at current level.",
  createdBy: "system"
});

await createNotification({
  tenantId: "tenant-1",
  learnerId: "demo-learner",
  recipientUserId: "user-parent-1",
  audience: "parent",
  type: "difficulty_proposal",
  title: "AIVO suggests a gentle increase in difficulty",
  body: "Based on recent progress, AIVO recommends trying slightly more challenging work.",
  relatedDifficultyProposalId: proposal.id
});
```

List notifications for a user:

```ts
const notifications = await listNotificationsForUser("user-parent-1");
```

These helpers are thin wrappers around `prisma` and can be extended as the domain model evolves.
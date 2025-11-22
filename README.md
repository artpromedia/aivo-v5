# Aivo v5 – Agentic AI Learning Platform Monorepo

This repository contains the Aivo v5 agentic AI learning platform implemented as a **Turborepo + pnpm monorepo**, not a single Node/Express app.

At a high level, the system provides:

- Multi-tenant, role-based admin experiences (platform admin, district admin).
- Learner- and parent/teacher-facing web and mobile apps.
- Backend services for model dispatch, baseline assessment, and an API gateway.
- Shared packages for types, UI components, and brain/model logic.
- **Content Authoring & Curriculum Management** system for creating curriculum-aligned learning materials.

## Repository layout

- `apps/` – Next.js frontends (App Router)
  - `web` – marketing / main web app
  - `learner-web` – learner-facing PWA
  - `parent-teacher-web` – parent/teacher web app
  - `admin-web` – unified admin console (platform + district admin flows)
  - `platform-admin-web` – independent platform admin app (optional)
  - `district-admin-web` – independent district admin app (optional)
- `mobile/` – Expo React Native apps
  - `learner-mobile`
  - `parent-teacher-mobile`
- `packages/` – shared libraries
  - `@aivo/types` – domain types (multi-tenancy, admin, assessments, content, etc.)
  - `@aivo/api-client` – typed client for backend APIs
  - `@aivo/ui` – shared UI components and theme
  - `@aivo/brain-model` – brain/model logic
  - `@aivo/persistence` – Prisma client and database helpers
  - `@aivo/auth` – Authentication utilities
  - `@aivo/agents` – Event-driven agent framework with Redis-backed state, memory, and orchestration support
- `services/` – backend services
  - `api-gateway` – Fastify gateway, auth context, admin APIs, content management, and routing
  - `baseline-assessment` – baseline assessment generator using model-dispatch
  - `brain-orchestrator` – lesson plan generation and brain profile management
  - `model-dispatch` – provider failover and routing for LLM calls
- `prisma/` – Prisma schema and migrations

## Prerequisites

- Node.js **>= 20**
- `pnpm` installed globally (for example: `npm install -g pnpm`)

## Install dependencies

```powershell
pnpm install
```

## Running in development

Start **everything** (all apps + services) using Turborepo:

```powershell
pnpm dev
```

Common dev entry points:

- API Gateway: `http://localhost:4000`
- Model Dispatch service: `http://localhost:4001`
- Baseline Assessment service: `http://localhost:4002`
- Web apps: Next.js apps start on `3000`+ and auto-increment if a port is in use. Check the console output for the exact URL, for example:
  - `platform-admin-web`: `http://localhost:3001`
  - `district-admin-web`: `http://localhost:3002`
  - `learner-web`: `http://localhost:3003`
  - `parent-teacher-web`: `http://localhost:3004`
  - `web`: `http://localhost:3005`
  - `admin-web`: `http://localhost:3006`

### Running specific apps

Platform Admin UI (tenants overview):

```powershell
cd apps/platform-admin-web
pnpm dev
```

District Admin UI (districts & schools overview):

```powershell
cd apps/district-admin-web
pnpm dev
```

Learner web app:

```powershell
cd apps/learner-web
pnpm dev
```

Parent/Teacher web app:

```powershell
cd apps/parent-teacher-web
pnpm dev
```

Main web app:

```powershell
cd apps/web
pnpm dev
```

Admin web (unified console):

```powershell
cd apps/admin-web
pnpm dev
```

### Only web apps via Turborepo

```powershell
pnpm dev:web
```

## Governance-powered admin dashboards

Two dedicated dashboards sit on top of the governance APIs so platform and district leaders can review usage, guardrails, and policy activity without touching code:

- **District Admin (`apps/district-admin-web`)** – visit `http://localhost:3002/tenant` after running `pnpm dev`. The page surfaces:
  - Curriculum + provider configuration for the current tenant.
  - Real-time usage pulse (LLM calls, tutor turns, incidents) with guardrail progress bars.
  - District/school coverage tables, role-assignment summaries, and the latest audit log slices.
- **Platform Admin (`apps/platform-admin-web`)** – visit `http://localhost:3001/tenants`. The experience includes:
  - Portfolio-level stats (active vs paused tenants, mix by tenant type).
  - An interactive tenant table; selecting a row loads tenant-specific guardrails, usage trends, analytics, and audit events.

Both dashboards rely on the running API Gateway (`http://localhost:4000`) for data via `@aivo/api-client`. If you seed additional tenants, the pages adapt automatically without extra configuration.

## Agent infrastructure

The `@aivo/agents` workspace package implements the cross-platform AI agent foundation used by services and apps:

- `BaseAgent` – abstract class with Redis-backed state/memory persistence, episodic recording, and OpenAI-compatible model helpers.
- Inter-agent messaging via Redis Pub/Sub (direct messages plus broadcast events) with correlation tracking and heartbeat monitoring.
- `AgentOrchestrator` – Bull-powered job orchestration layer that sequences or parallelizes agent steps, enforces dependency ordering, retries, and tracks insights/errors.

### Usage

```powershell
# Compile the package
pnpm --filter @aivo/agents build
```

Set these environment variables before running agents or orchestrations:

- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (optional) – connection for state + coordination.
- `OPENAI_API_KEY` – required when agent `modelConfig.provider` is `openai`.

See `packages/agents/README.md` for deeper usage notes and extension guidance.

When implementing new agent-driven services, import `BaseAgent`/`AgentOrchestrator` directly from `@aivo/agents` so every worker inherits the shared Redis-backed state, coordination hooks, and memory primitives. Make sure the `REDIS_*` and `OPENAI_API_KEY` variables above are present before calling `agent.initialize()` in those consumers.

> ⚠️ Running `pnpm install` or any Jest-powered task may surface `ts-jest` peer dependency warnings because the monorepo currently targets the TypeScript 6 prerelease builds. These warnings are expected and caused by upstream support lag; no action is required unless you downgrade TypeScript.

## Linting and tests

Run lint across the monorepo:

```powershell
pnpm lint
```

Run tests (where configured):

```powershell
pnpm test
```

### Targeted linting with Turborepo filters

This repo uses **Turborepo** under the hood for linting. The `lint` task is defined at the root as:

- Root `package.json`: `"lint": "turbo lint"`

Each workspace that supports linting exposes its own `lint` script. To lint just one app or service, filter **by package name**, not by path:

- API Gateway service (package name: `@aivo/api-gateway`):

   ```powershell
   pnpm lint --filter @aivo/api-gateway
   ```

- Parent/Teacher web app (package name: `parent-teacher-web`):

   ```powershell
   pnpm lint --filter parent-teacher-web
   ```

You can combine filters to lint multiple projects at once:

```powershell
pnpm lint --filter @aivo/api-gateway --filter parent-teacher-web
```

#### Filter vs. path patterns

The `dev:web` script uses **path-style filters** with `...` to include dependencies, for example:

- Root `package.json`: `"dev:web": "turbo dev --filter=apps/web... --filter=apps/learner-web... --filter=apps/parent-teacher-web..."`

For linting, you should generally stick with **bare package names** (like `parent-teacher-web` or `@aivo/api-gateway`) and omit the `apps/` or `services/` prefix.

If a filter fails, double-check the `name` field in that package's `package.json` and use that value directly.

## Database schema & Prisma

The unified neurodiverse learning schema lives in `prisma/schema.prisma` and powers every service/package that calls Prisma.

```powershell
# Install Prisma CLI + client (already part of pnpm workspaces, but handy for fresh clones)
pnpm install prisma @prisma/client

# Copy the example env file and update credentials as needed
copy .env.example .env

# Start the local Postgres container (runs on localhost:5433 by default)
docker compose -f docker-compose.db.yml up -d

# Run the initial migration against your local Postgres
pnpm exec prisma migrate dev --name init

# Generate the Prisma client for all packages that import @aivo/persistence
pnpm exec prisma generate

# Optional: load demo caregivers/teachers/learners or inspect records
pnpm seed
pnpm seed:dev-users
pnpm exec prisma studio
```

Environment variables required for local development (the defaults line up with `docker-compose.db.yml`):

```env
DATABASE_URL="postgresql://aivo:aivo@localhost:5433/aivo_v5?schema=public"
DIRECT_URL="postgresql://aivo:aivo@localhost:5433/aivo_v5?schema=public"

OPENAI_API_KEY="sk-..."

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

Add any additional provider keys (OpenAI org IDs, Pinecone credentials, etc.) as your workflow requires.

## Content Authoring & Curriculum Management

Aivo v5.1 includes a comprehensive content authoring system that allows educators to create, manage, and approve curriculum-aligned learning materials.

### Features

- **Curriculum Topics**: Define topics aligned to regional standards (e.g., CCSS, UK National Curriculum)
- **Content Items**: Create explanations, worked examples, and practice questions
- **AI-Assisted Generation**: Generate draft content using AI, requiring human review before approval
- **Multi-tenant**: Each tenant maintains their own curriculum library
- **Role-based Access**: District/platform admins create topics; teachers create/approve content
- **Status Workflow**: Draft → Approved → Archived lifecycle for quality control

### Access the Content UI

1. Start the admin web app: `pnpm --filter admin-web dev`
2. Navigate to: `http://localhost:3006/content/topics`
3. Create topics and content items through the web interface

### API Endpoints

- `GET /content/topics` - List curriculum topics
- `POST /content/topics` - Create a new topic
- `PATCH /content/topics/:topicId` - Update a topic
- `GET /content/items?topicId=X` - List content items for a topic
- `POST /content/items` - Create a content item
- `PATCH /content/items/:itemId` - Update a content item
- `POST /content/generate-draft` - Generate AI-drafted content

For detailed documentation, see [docs/content-authoring-system.md](docs/content-authoring-system.md).

## Caregiver & Learner Onboarding

The `apps/web` experience now includes full caregiver self-registration, role-aware login, and
secure learner provisioning flows backed by NextAuth v5 + Prisma. The architecture, API endpoints,
and environment configuration for these AI chatbot onboarding flows are documented in
[docs/ai-chatbot-auth.md](docs/ai-chatbot-auth.md).

## Local database (PostgreSQL via Docker)

Run a local Postgres instance with Docker (requires Docker Desktop):

```powershell
docker compose -f docker-compose.db.yml up -d postgres
```

The `aivo-v5-postgres` container maps host port `5433` to Postgres `5432` and seeds a database named `aivo_v5` with username/password `aivo/aivo`. Update `DATABASE_URL` if you change these defaults. When you are finished developing, stop it with:

```powershell
docker compose -f docker-compose.db.yml down
```

## Notes

- Uses **pnpm workspaces** and **Turborepo** for orchestration.
- Next.js, Tailwind CSS, ESLint, and Prettier are configured at the root.
- Admin flows use a dev-only middleware/header-based mock auth (`x-aivo-user`) for platform and district admin roles.
- Database: PostgreSQL (via Docker) in all environments.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Add tests where appropriate.
5. Open a pull request.

## License

MIT License – see the `LICENSE` file for details.

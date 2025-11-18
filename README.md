## Aivo v5 – Agentic AI Learning Platform Monorepo

This repository contains the Aivo v5 agentic AI learning platform implemented as a **Turborepo + pnpm monorepo**, not a single Node/Express app.

At a high level, the system provides:

- Multi-tenant, role-based admin experiences (platform admin, district admin).
- Learner- and parent/teacher-facing web and mobile apps.
- Backend services for model dispatch, baseline assessment, and an API gateway.
- Shared packages for types, UI components, and brain/model logic.

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
   - `@aivo/types` – domain types (multi-tenancy, admin, assessments, etc.)
   - `@aivo/api-client` – typed client for backend APIs
   - `@aivo/ui` – shared UI components and theme
   - `@aivo/brain-model` – brain/model logic
- `services/` – backend services
   - `api-gateway` – Fastify gateway, auth context, admin APIs, and routing
   - `baseline-assessment` – baseline assessment generator using model-dispatch
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

## Notes

- Uses **pnpm workspaces** and **Turborepo** for orchestration.
- Next.js, Tailwind CSS, ESLint, and Prettier are configured at the root.
- Admin flows use a dev-only middleware/header-based mock auth (`x-aivo-user`) for platform and district admin roles.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Add tests where appropriate.
5. Open a pull request.

## License

MIT License – see the `LICENSE` file for details.
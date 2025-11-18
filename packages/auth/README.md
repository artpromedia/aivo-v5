# @aivo/auth

Shared authentication utilities for the AIVO v5 monorepo.

This package provides:

- **JWT claim types** and helpers for signing and verifying access tokens.
- **Client-side auth helpers** for web apps (storing tokens, creating an API client).

## Exposed API

### Server-side

From `@aivo/auth`:

- `signAccessToken(claims, secret, ttlSeconds?)`
  - Signs a JWT with the given claims and secret.
  - `claims` includes `sub`, `tenantId`, `roles`, and optional `name`/`email`.
- `verifyAccessToken(token, secret)`
  - Verifies a JWT and returns the decoded payload or throws on failure.

These are used by `services/api-gateway` to:

- Issue access tokens from `/auth/login`.
- Decode tokens in `authContext` and attach a `RequestUser` to each request.

### Client-side

From `@aivo/auth/client`:

- `loadAuthState()` / `saveAuthState()` / `clearAuthState()`
  - Helpers to persist `{ accessToken, user }` in `localStorage`.
- `createApiClient(getToken)`
  - Returns a simple wrapper around `fetch` that automatically sends
    `Authorization: Bearer <token>` when a token is available.

These are used by `apps/parent-teacher-web` in `AuthProvider`.

## Usage

### In api-gateway (dev login)

`services/api-gateway/src/server.ts` implements:

- `POST /auth/login`:
  - Looks up a `User` and `RoleAssignment` records by email using
    `findUserWithRolesByEmail` from `@aivo/persistence`.
  - Builds `roles` from the DB and signs a JWT via `signAccessToken`.
- `GET /me`:
  - Returns the decoded `RequestUser` derived from the JWT.

### In parent-teacher web app

`apps/parent-teacher-web` uses an `AuthProvider` that:

- Calls `/auth/login` with an email/password (password is ignored in dev).
- Stores the `{ accessToken, user }` pair using the client helpers.
- Wraps the app so components can read `useAuth()` to know if a user is logged in.

## Dev seeding

To make the login flow work out of the box, run:

```bash
pnpm seed:dev-users
```

This script (`scripts/seed-dev-users.ts`):

- Upserts tenant `tenant-1`.
- Upserts a `User` with `email: "parent@example.com"` under `tenant-1`.
- Creates a `RoleAssignment` with role `"parent"` for that user.

You can then log in from the parent-teacher web UI using:

- **Email**: `parent@example.com`
- **Password**: any non-empty string (ignored in dev)

The resulting JWT contains the `parent` role and `tenant-1` tenant ID for use
by downstream services and UIs.
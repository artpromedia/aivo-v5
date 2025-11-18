# parent-teacher-web

Parent/Teacher web app. Contains role-toggle UI and a calm learner overview for caregivers.

Start locally with:

```powershell
pnpm dev --filter=apps/parent-teacher-web...
```

## Auth & /me dependency

This app expects the backend `api-gateway` to expose a `/me` endpoint and uses it on the root
dashboard to determine which learner is currently in focus. In development, `/me` is driven by a
mock auth context that reads the `x-aivo-user` header.

- If you don&apos;t send `x-aivo-user`, the gateway will fall back to a default demo user/learner.
- To impersonate a specific caregiver in dev, add an `x-aivo-user` header in your browser or API
	client that matches one of the mock users defined in the gateway.

The learner overview page (`/learner`) receives the learner ID via the `learnerId` query string and
uses it to fetch caregiver-specific data and notifications.

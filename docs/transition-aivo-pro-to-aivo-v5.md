# Transition Plan: AIVO PRO (Python) → AIVO v5 (Node/Turborepo)

This document describes how to migrate or re-implement key behaviors from the legacy Python-based repo (`artpromedia/aivo-pro`) into the new Node/Turborepo monorepo (`artpromedia/aivo-v5`).

## Legacy Patterns (Python)

From the old repo:

- **Backend runtime**: Python, with:
  - LLM orchestration (prompt building, provider switching).
  - Baseline assessment question generation.
  - Mastery estimation and difficulty recommendation.
- **Frontends/services**: TS/JS-coded UIs and some service shims.

## New Architecture (Node/Turborepo)

Key services and packages:

- `services/model-dispatch`: LLM provider dispatch & failover in Node.
- `services/baseline-assessment`: LLM-based question generation.
- `services/brain-orchestrator`: Lesson and session orchestration.
- `packages/persistence`: Prisma-based DB with Learners, BrainProfiles, Sessions, Proposals, Notifications.
- `packages/brain-model`: Shared TS utilities for mastery & recommendations.

## Mapping Old Behaviors to New Components

1. **Baseline Assessments**
   - Old: Python functions generating items & interpreting answers.
   - New:
     - Question generation lives in `services/baseline-assessment`.
     - Answer interpretation & mastery updates should move into:
       - `services/brain-orchestrator` (logic).
       - `packages/persistence` (update BrainProfile & SubjectLevel JSON).
     - Use TypeScript versions of any scoring formulas previously written in Python.

2. **Difficulty Recommendations**
   - Old: Python-level heuristics per subject.
   - New:
     - Centralized in `packages/brain-model` (e.g., `getDifficultyRecommendations`).
     - Decisions persisted as `DifficultyProposal` via `@aivo/persistence`.
     - Caregiver approval flows in `services/api-gateway` + parent/teacher UIs.

3. **Session & Tutoring Flows**
   - Old: Possibly Python endpoints building sequences of exercises.
   - New:
     - Session scaffolding in `services/api-gateway` (using DB-backed `Session`).
     - Lesson content in `services/brain-orchestrator`.
     - Learner-facing UI in `apps/learner-app` and `apps/learner-web` (v5).

4. **Multi-tenancy & Admin**
   - Old: Tenant & user management patterns in Python.
   - New:
     - Tenants, role assignments & admin views in Node:
       - `packages/persistence` (Tenant, RoleAssignment).
       - `services/api-gateway` admin routes.
       - `apps/admin-web` UI.

## Recommended Migration Steps

1. Identify the **core Python algorithms** to port:
   - Mastery estimation (per subject).
   - Difficulty step sizing (how many levels up/down).
   - Any SEL or neurodiversity-specific scaffolding rules.

2. For each:
   - Rewrite in TypeScript under `packages/brain-model`.
   - Add tests (Jest/Vitest) to validate behavior using old examples/fixtures.
   - Replace legacy in-memory mocks with DB-backed flows using `@aivo/persistence`.

3. Gradually deprecate Python services:
   - For each Python endpoint, add a Node equivalent in `api-gateway` and services.
   - Once parity is reached and frontends no longer rely on old endpoints, archive the Python code.

## Data Migration

If you intend to migrate real data from an existing Python deployment:

- Export learners & assessments from the old DB as JSON/CSV.
- Write a one-off Node script in this monorepo that:
  - Uses `@aivo/persistence` to insert:
    - Tenants
    - Users
    - Learners
    - BrainProfiles (derived from historical assessments)
- Run the script in a controlled environment, verifying row counts & sample rows.

## Summary

The new architecture preserves the conceptual structure of AIVO PRO:

- Agentic per-learner brain models.
- Human-in-the-loop difficulty adjustments.
- Multi-tenant, district-oriented deployments.

But it consolidates everything into the Node/Turborepo world, enabling:

- Shared TypeScript logic between services and frontends.
- Easier deployment and scaling.
- Simpler collaboration for JS/TS-oriented teams.

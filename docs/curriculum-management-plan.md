# AI-Enhanced Curriculum Management Plan

## Objectives
- Map curriculum assets to jurisdictional standards (CCSS, TEKS, etc.) with grade bands, skills, and success criteria.
- Allow educators to request AI-driven adaptations that respect learner profiles and guardrails.
- Support multi-modal content (text, audio, visual, interactive) with version control and approval workflows.
- Track effectiveness through learner interactions, educator feedback, and AI recommendations over time.
- Surface insights in the teacher portal with an AI-assisted editor, standards selector, media library, and preview workspace.

## Data Model Additions
- `LearningStandard`: canonical catalog of standards with jurisdiction, grade band, subject, skill focus, and metadata tags.
- `CurriculumUnit`: grade/subject-focused collections aligned to one or more standards.
- `CurriculumModule`: scoped learning experiences within units, referencing prerequisite modules and focus skills.
- `CurriculumContent`: educator-authored content shells (lesson, activity, assessment, sensory support, etc.)
- `ContentVersion`: version history with AI prompts, diff metadata, reviewer approvals, and rollout status.
- `ContentAsset`: multi-modal asset registry per version (text blocks, audio URLs, haptic cues, etc.)
- `ContentInteraction`: track learner/teacher usage with ratings, feedback, and modalities consumed.
- `ContentEffectiveness`: daily aggregates for engagement, mastery delta, sentiment, and AI quality to power analytics.

## Services & AI Flow
1. **ContentAdapter** (new helper) wraps OpenAI/generative models with guardrails to transform content for a learner persona.
2. **CurriculumManager** orchestrates:
   - Standards lookup + alignment suggestions.
   - AI adaptation requests from teachers with context (learner profile, target modality, scaffolding needs).
   - Version creation + diffing between educator edits and AI drafts.
   - Publishing workflow (draft → review → active → archived).
3. **ContentEffectivenessTracker** ingests `ContentInteraction` events, aggregates metrics, and exposes API summaries.
4. AI calls default to `gpt-4o-mini` with deterministic temperature plus fallback copy when API unavailable.

## Teacher Portal UI (App Router)
- `/app/(portals)/teacher/content/editor`:
  - **Sidebar**: Standards selector filter by grade, subject, code; displays coverage, alignment suggestions.
  - **Main Canvas**: TipTap-based rich editor with multi-modal block palette, version diff badge, inline AI assist button.
  - **Assistant Drawer**: Chat-style AI assistant streaming adaptation output, allowing quick insert into editor.
  - **Resource Rail**: Media library cards (upload placeholders), preview chips showing modality readiness, quality score.
  - **Effectiveness Panel**: Sparkline & tags pulled from analytics service for currently selected content.

## APIs (Next.js App Router)
- `POST /api/curriculum/adapt`: request AI adaptation with learner/context parameters.
- `GET /api/curriculum/standards`: list standards with filters.
- `POST /api/curriculum/content`: create shell + initial version.
- `PATCH /api/curriculum/content/:id`: update metadata/labels.
- `POST /api/curriculum/content/:id/version`: create new version (AI or manual) and record diff summary.
- `POST /api/curriculum/content/:id/publish`: transition version status.
- `POST /api/curriculum/interactions`: log usage metrics from editor/lesson delivery.
- `GET /api/curriculum/effectiveness`: aggregated metrics per content/module.

### Post-lesson interaction logging
- Delivery surfaces (LMS embeds, classroom displays, printable kits) must POST to `/api/curriculum/interactions/log` immediately after a session ends.
- Include `interactionType`, `modality`, `durationSeconds`, optional `feedbackRating`, and any `masteryEvidence` JSON so the effectiveness tracker can bucket by modality and learner profile.
- The teacher editor reads these events every refresh and renders engagement/mastery sparklines—without at least 5 recent interactions the panel shows "insufficient data".
- Encourage educators to submit a quick sentiment rating when wrapping a lesson; those scores flow directly into `ContentEffectiveness.educatorSentiment`.

## Analytics & Tracking
- Buffer `ContentInteraction` events and periodically aggregate into `ContentEffectiveness` (rolling 7/30 day stats).
- Provide helper for teacher UI to fetch `effectiveness summary` (engagement score, mastery lift, comments) and `interaction timeline`.
- Persist AI recommendation quality, adaptation confidence, and educator rating to correlate with mastery.

## Ops & Deployment
- Prisma migrations now live under `apps/web/prisma/migrations` starting with `20251121143540_init`; removing drifted history ensures `pnpm --filter web exec prisma migrate status --schema prisma/schema.prisma` runs cleanly.
- `pnpm install` + `pnpm --filter web exec prisma migrate dev --schema prisma/schema.prisma` keeps the local database synchronized.
- Document new env vars (`AI_ADAPTATION_MODEL`, `MEDIA_CDN_BASE_URL`) and socket usage instructions in `README.md`.
- Expose `/api/socket` usage for teacher editor (AI assistant real-time updates share same namespace as communication hub).

## Edge Cases & Safeguards
- Fallback copy if OpenAI key missing or request fails; mark version with `SOURCE="FALLBACK"`.
- Reject adaptation if requested modality not supported by content type.
- Hard-cap AI prompt lengths, strip PII, and log adaptation metadata for audit.
- Ensure version publish enforces one active version per content within module.
- Analytics tracker catches divide-by-zero by using safe denominators and clamps metrics 0–1 or 0–100.

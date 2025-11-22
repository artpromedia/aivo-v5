# AI-Powered Focus Monitor & Brain Breaks

This document captures how the learner web experience detects distraction, pauses lessons, and spins up quick educational games while keeping learner privacy in mind.

## Architecture Overview

1. **Client-side attention tracking** (`apps/web/lib/focus/focus-monitor.ts`)
   - Lightweight trackers watch mouse velocity, scroll momentum, keyboard idle time, and tab visibility.
   - Metrics stay in-memory on the learner device; only aggregated scores are surfaced.
   - `FocusMonitor` clamps values between 0-100 and exposes `registerInteraction()` and `resetFocus()` helpers the UI can call.

2. **Distraction orchestration hook** (`useFocusMonitor`)
   - Normalizes sensitivity (`LOW`, `MEDIUM`, `HIGH`) into idle and distraction thresholds.
   - Streams metrics every 5 seconds to calling components, while firing a callback the moment the score breaches the configured floor.
   - Sends privacy-friendly notifications via `/api/focus/distraction-detected`, forwarding only: learnerId, distraction type, focus score, session duration, and timestamp (no raw pointer positions or keystrokes).

3. **Game generation pipeline** (`apps/web/app/api/focus/generate-game`)
   - Calls `generateGameDefinition` on the server. When OpenAI is unavailable, it immediately falls back to deterministic templates so breaks always work offline.
   - Returns a `GameDefinition` that the `FocusBreakGame` component renders across puzzle, memory, quiz, movement, and creative modes.

4. **Learning session UI** (`apps/web/app/(portals)/learn/lesson/[id]/page.tsx`)
   - Subscribes to the monitor hook, dims lesson content when paused, and overlays the `FocusBreakGame` component until the learner completes the activity.
   - Logs `/api/focus/game-completed` so caretakers can review break history.

## Privacy-First Design

- **Local-only raw signals**: Mouse coordinates, scroll deltas, and keystroke timings never leave the browser. Only derived metrics (focus score, distraction counts, timestamps) are sent server-side.
- **Configurable notifications**: `FocusMonitor` accepts an `onLog` callback, making it easy to disable networking entirely or route through a custom privacy gateway per tenant.
- **Short retention**: Session metrics are transient and reset after each break (`resetFocus()`), preventing long-term behavioral profiling by default.
- **Transparent UX**: The learning session explicitly notifies the learner (“Focus break triggered”) whenever monitoring changes the UI, reinforcing consent and awareness.

## Extending or Auditing

- Use `FocusMonitor`'s `checkIntervalMs` to slow down sampling for extra power savings or more aggressive privacy thresholds.
- Swap out the default notification handler in `useFocusMonitor` to integrate with district-approved messaging systems.
- To add new game types, extend `GameType`, update `buildFallbackGame`, and let the OpenAI prompt know about the new modality.

For a quick smoke test, run:

```powershell
pnpm --filter web dev
```

Then visit `/learn/lesson/<learnerId>` to observe the monitor toggling between lessons and games.

import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware wrapper to collect HTTP request metrics
 * 
 * Usage in API routes:
 * ```typescript
 * import { withMetrics } from '@/lib/middleware/metrics';
 * 
 * async function handler(request: NextRequest) {
 *   // Your handler logic
 *   return NextResponse.json({ data: 'result' });
 * }
 * 
 * export const GET = withMetrics(handler);
 * ```
 */

type RouteHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

/**
 * Extract a normalized route pattern from the URL
 */
function normalizeRoute(pathname: string): string {
  // Replace dynamic segments with placeholders
  // e.g., /api/homework/abc123 -> /api/homework/:id
  return pathname
    .replace(/\/[a-f0-9-]{36}/gi, '/:uuid') // UUIDs
    .replace(/\/\d+/g, '/:id') // Numeric IDs
    .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:id'); // Long alphanumeric IDs
}

/**
 * Wrap an API route handler with metrics collection
 */
export function withMetrics(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    const start = Date.now();
    const route = normalizeRoute(request.nextUrl.pathname);
    const method = request.method;

    let statusCode = 500;

    try {
      const response = await handler(request, context);
      statusCode = response.status;
      return response;
    } catch (error) {
      // Re-throw to let Next.js handle the error
      throw error;
    } finally {
      const durationSeconds = (Date.now() - start) / 1000;

      // Import metrics dynamically to avoid issues in edge runtime
      try {
        const { recordHttpRequest } = await import('@aivo/metrics');
        recordHttpRequest(method, route, statusCode, durationSeconds);
      } catch {
        // Silently fail if metrics aren't available
        // This can happen in edge runtime or during build
      }
    }
  };
}

/**
 * Track custom business metrics
 */
export async function trackBusinessMetric(
  metricName: string,
  value: number,
  labels: Record<string, string> = {}
): Promise<void> {
  try {
    const metrics = await import('@aivo/metrics');

    // Map metric names to their counters/gauges
    switch (metricName) {
      case 'homework_session_created':
        metrics.homeworkSessionsCreated.inc(labels);
        break;
      case 'assessment_completed':
        metrics.assessmentCompletions.inc(labels);
        break;
      case 'emotion_checkin':
        metrics.emotionCheckins.inc(labels);
        break;
      case 'calm_corner_visit':
        metrics.calmCornerVisits.inc(labels);
        break;
      case 'focus_break':
        metrics.focusBreaksTaken.inc(labels);
        break;
      case 'error':
        metrics.errorRate.inc(labels);
        break;
      default:
        console.warn(`Unknown business metric: ${metricName}`);
    }
  } catch {
    // Silently fail if metrics aren't available
  }
}

/**
 * Track AI request metrics
 */
export async function trackAiRequest(
  provider: string,
  model: string,
  type: string,
  status: 'success' | 'error',
  durationSeconds: number,
  promptTokens?: number,
  completionTokens?: number
): Promise<void> {
  try {
    const { recordAiRequest } = await import('@aivo/metrics');
    recordAiRequest(provider, model, type, status, durationSeconds, promptTokens, completionTokens);
  } catch {
    // Silently fail if metrics aren't available
  }
}

/**
 * Track database query metrics
 */
export async function trackDbQuery(
  operation: string,
  model: string,
  status: 'success' | 'error',
  durationSeconds: number
): Promise<void> {
  try {
    const { recordDbQuery } = await import('@aivo/metrics');
    recordDbQuery(operation, model, status, durationSeconds);
  } catch {
    // Silently fail if metrics aren't available
  }
}

/**
 * Create a session timer for tracking active sessions
 */
export async function createSessionTimer(
  type: string,
  subject: string
): Promise<() => Promise<void>> {
  try {
    const { startSessionTimer, learningSessionDuration } = await import('@aivo/metrics');
    const endTimer = startSessionTimer(type, subject);

    return async () => {
      const { durationSeconds } = endTimer();
      learningSessionDuration.observe(
        { type, subject, completion_status: 'completed' },
        durationSeconds
      );
    };
  } catch {
    // Return a no-op if metrics aren't available
    return async () => {};
  }
}

/**
 * Update active users gauge
 */
export async function updateActiveUsers(
  role: string,
  delta: number
): Promise<void> {
  try {
    const { activeUsers } = await import('@aivo/metrics');
    if (delta > 0) {
      activeUsers.inc({ role }, delta);
    } else {
      activeUsers.dec({ role }, Math.abs(delta));
    }
  } catch {
    // Silently fail if metrics aren't available
  }
}

/**
 * Update WebSocket connection gauge
 */
export async function updateWsConnections(
  type: string,
  delta: number
): Promise<void> {
  try {
    const { wsConnectionsActive } = await import('@aivo/metrics');
    if (delta > 0) {
      wsConnectionsActive.inc({ type }, delta);
    } else {
      wsConnectionsActive.dec({ type }, Math.abs(delta));
    }
  } catch {
    // Silently fail if metrics aren't available
  }
}

/**
 * Track cache hit/miss
 */
export async function trackCacheAccess(
  cacheName: string,
  hit: boolean
): Promise<void> {
  try {
    const { cacheHits, cacheMisses } = await import('@aivo/metrics');
    if (hit) {
      cacheHits.inc({ cache_name: cacheName });
    } else {
      cacheMisses.inc({ cache_name: cacheName });
    }
  } catch {
    // Silently fail if metrics aren't available
  }
}

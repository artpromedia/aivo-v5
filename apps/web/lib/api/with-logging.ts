/**
 * API Logging Wrapper for AIVO v5
 * 
 * Provides consistent logging for all API routes with:
 * - Request/response logging
 * - Duration tracking
 * - Error handling
 * - Request ID correlation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger, LogContext } from '@aivo/logger';
import { REQUEST_ID_HEADER } from '../middleware/request-id';

const logger = createLogger('api');

export interface LoggingOptions {
  /** Include request body in logs (careful with sensitive data) */
  logBody?: boolean;
  /** Include response body in logs */
  logResponse?: boolean;
  /** Custom context to add to all logs */
  context?: LogContext;
}

type RouteHandler = (
  request: NextRequest,
  context: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap an API route handler with logging
 * 
 * @example
 * ```typescript
 * export const GET = withLogging(
 *   async (request) => {
 *     return NextResponse.json({ message: 'Hello' });
 *   },
 *   'get-user'
 * );
 * ```
 */
export function withLogging(
  handler: RouteHandler,
  routeName: string,
  options: LoggingOptions = {}
): RouteHandler {
  return async (request: NextRequest, ctx: { params: Record<string, string> }) => {
    const requestId = request.headers.get(REQUEST_ID_HEADER) || 'unknown';
    const startTime = Date.now();
    const url = new URL(request.url);

    // Create child logger with request context
    const reqLogger = logger.child({
      requestId,
      method: request.method,
      path: url.pathname,
      route: routeName,
      userAgent: request.headers.get('user-agent') || undefined,
      ...options.context,
    });

    // Log request start
    reqLogger.info('Request started', {
      query: Object.fromEntries(url.searchParams),
    });

    try {
      // Execute handler
      const response = await handler(request, ctx);
      const duration = Date.now() - startTime;

      // Log successful response
      reqLogger.info('Request completed', {
        statusCode: response.status,
        duration,
      });

      // Add timing header
      response.headers.set('x-response-time', `${duration}ms`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      reqLogger.error('Request failed', error as Error, {
        duration,
      });

      // Re-throw to let Next.js handle the error response
      throw error;
    }
  };
}

/**
 * Combine multiple middleware functions
 * 
 * @example
 * ```typescript
 * export const POST = compose(
 *   withLogging,
 *   withValidation(schema),
 *   withAuth
 * )(handler, 'create-session');
 * ```
 */
export function composeMiddleware(
  ...middlewares: Array<(handler: RouteHandler, name: string) => RouteHandler>
) {
  return (handler: RouteHandler, routeName: string): RouteHandler => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc, routeName),
      handler
    );
  };
}

/**
 * Log API errors with context
 */
export function logApiError(
  routeName: string,
  error: Error,
  context?: LogContext
): void {
  const apiLogger = createLogger('api');
  apiLogger.error(`API error in ${routeName}`, error, context);
}

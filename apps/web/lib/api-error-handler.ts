/**
 * API Error Handler
 * 
 * Provides utilities for handling errors in API routes with Sentry integration.
 * Includes error capture, context enrichment, and standardized error responses.
 */

import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Standard API error response structure
 */
export interface APIErrorResponse {
  error: string;
  code?: string;
  message?: string;
  requestId?: string;
}

/**
 * Custom API error with additional context
 */
export class APIError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.context = context;
    
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = 'BAD_REQUEST') {
    return new APIError(message, 400, code);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new APIError(message, 401, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new APIError(message, 403, code);
  }

  static notFound(message = 'Not found', code = 'NOT_FOUND') {
    return new APIError(message, 404, code);
  }

  static conflict(message: string, code = 'CONFLICT') {
    return new APIError(message, 409, code);
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMITED') {
    return new APIError(message, 429, code);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new APIError(message, 500, code);
  }
}

/**
 * Type for route handler params (dynamic route segments)
 */
type RouteContext = {
  params?: Record<string, string | string[]>;
};

/**
 * Type for Next.js route handler function
 */
type NextHandler<T = unknown> = (
  req: NextRequest,
  context: RouteContext
) => Promise<NextResponse<T>>;

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Higher-order function to wrap API routes with error handling
 * 
 * @example
 * ```typescript
 * // In your API route file
 * import { withErrorHandling } from '@/lib/api-error-handler';
 * 
 * async function handler(req: NextRequest) {
 *   const data = await fetchSomeData();
 *   return NextResponse.json(data);
 * }
 * 
 * export const GET = withErrorHandling(handler);
 * ```
 */
export function withErrorHandling<T = unknown>(
  handler: NextHandler<T>,
  options?: {
    /** Additional context to include in error reports */
    context?: Record<string, unknown>;
    /** Whether to include request body in error context (be careful with PII) */
    includeBody?: boolean;
  }
): NextHandler<T | APIErrorResponse> {
  return async (req: NextRequest, routeContext: RouteContext) => {
    const requestId = generateRequestId();
    
    // Set request ID header for tracking
    const startTime = Date.now();
    
    // Add breadcrumb for request start
    Sentry.addBreadcrumb({
      category: 'http',
      message: `${req.method} ${req.nextUrl.pathname}`,
      level: 'info',
      data: {
        requestId,
        method: req.method,
        url: req.nextUrl.pathname,
        query: Object.fromEntries(req.nextUrl.searchParams),
      },
    });

    try {
      const response = await handler(req, routeContext);
      
      // Add request ID to response headers
      response.headers.set('X-Request-Id', requestId);
      
      // Log slow requests
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        Sentry.captureMessage(`Slow API request: ${req.nextUrl.pathname}`, {
          level: 'warning',
          extra: {
            requestId,
            duration,
            method: req.method,
            url: req.nextUrl.pathname,
          },
        });
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Build error context
      const errorContext: Record<string, unknown> = {
        requestId,
        url: req.nextUrl.pathname,
        method: req.method,
        duration,
        query: Object.fromEntries(req.nextUrl.searchParams),
        params: routeContext.params,
        ...options?.context,
      };

      // Include sanitized body if requested
      if (options?.includeBody) {
        try {
          const contentType = req.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const body = await req.clone().json();
            // Sanitize sensitive fields
            const sanitizedBody = sanitizeObject(body);
            errorContext.body = sanitizedBody;
          }
        } catch {
          // Ignore body parsing errors
        }
      }

      // Handle known API errors
      if (error instanceof APIError) {
        // Only capture non-operational errors in Sentry
        if (!error.isOperational) {
          Sentry.captureException(error, {
            extra: {
              ...errorContext,
              ...error.context,
            },
          });
        }

        return NextResponse.json<APIErrorResponse>(
          {
            error: error.message,
            code: error.code,
            requestId,
          },
          {
            status: error.statusCode,
            headers: { 'X-Request-Id': requestId },
          }
        );
      }

      // Handle unknown errors
      Sentry.captureException(error, {
        extra: errorContext,
      });

      // Log error details (will be captured by Sentry)
      console.error(`[${requestId}] API Error:`, error);

      // Return generic error response (don't expose internal details)
      return NextResponse.json<APIErrorResponse>(
        {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          requestId,
        },
        {
          status: 500,
          headers: { 'X-Request-Id': requestId },
        }
      );
    }
  };
}

/**
 * Sanitize object by removing sensitive fields
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'auth',
    'credential',
    'ssn',
    'social_security',
    'credit_card',
    'card_number',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[FILTERED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Set user context for error tracking
 * Call this after authentication to attach user info to errors
 */
export function setUserContext(user: {
  id: string;
  role?: string;
  tenantId?: string;
}) {
  Sentry.setUser({
    id: user.id,
    // Don't include email or other PII
  });
  
  // Set custom context for role and tenant
  Sentry.setContext('user_info', {
    role: user.role,
    tenantId: user.tenantId,
  });
}

/**
 * Clear user context (call on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for tracking user actions
 */
export function addActionBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
  });
}

/**
 * Capture a custom event/metric
 */
export function captureEvent(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  extra?: Record<string, unknown>
) {
  Sentry.captureMessage(message, {
    level,
    extra,
  });
}

export default withErrorHandling;

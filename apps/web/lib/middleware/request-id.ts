/**
 * Request ID Middleware for AIVO v5
 * 
 * Generates or forwards request IDs for distributed tracing
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  // Use crypto.randomUUID if available (Node 19+, modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: timestamp + random string
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Extract or generate request ID from request
 */
export function getRequestId(request: NextRequest): string {
  return request.headers.get(REQUEST_ID_HEADER) || generateRequestId();
}

/**
 * Request ID middleware
 * Ensures every request has a unique identifier for tracing
 */
export function requestIdMiddleware(request: NextRequest): NextResponse {
  const requestId = getRequestId(request);
  
  // Create response with request ID header
  const response = NextResponse.next();
  response.headers.set(REQUEST_ID_HEADER, requestId);
  
  return response;
}

/**
 * Middleware configuration for request ID
 * Use this in your middleware.ts
 * 
 * @example
 * ```typescript
 * // middleware.ts
 * import { requestIdMiddleware } from '@/lib/middleware/request-id';
 * 
 * export function middleware(request: NextRequest) {
 *   return requestIdMiddleware(request);
 * }
 * ```
 */
export function withRequestId(
  handler: (request: NextRequest) => NextResponse | Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = getRequestId(request);
    
    // Add request ID to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(REQUEST_ID_HEADER, requestId);
    
    // Execute handler
    const response = await handler(request);
    
    // Ensure request ID is in response
    response.headers.set(REQUEST_ID_HEADER, requestId);
    
    return response;
  };
}

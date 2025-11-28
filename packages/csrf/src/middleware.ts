/**
 * CSRF Middleware
 * 
 * Provides middleware functions for CSRF protection in Next.js.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { CSRFConfig, CSRFErrorResponse } from './types';
import { validateDoubleSubmitToken, generateDoubleSubmitToken } from './token';
import { CSRF_DEFAULTS, SAFE_METHODS, DEFAULT_EXCLUDED_PATHS } from './constants';

/**
 * Check if a request method is safe (doesn't need CSRF protection)
 */
export function isSafeMethod(method: string): boolean {
  return SAFE_METHODS.includes(method.toUpperCase() as (typeof SAFE_METHODS)[number]);
}

/**
 * Check if a path should be excluded from CSRF validation
 */
export function isExcludedPath(pathname: string, excludePaths: string[] = []): boolean {
  const allExcludedPaths = [...DEFAULT_EXCLUDED_PATHS, ...excludePaths];
  return allExcludedPaths.some(path => pathname.startsWith(path));
}

/**
 * Create a CSRF error response
 */
export function createCSRFErrorResponse(message: string): NextResponse<CSRFErrorResponse> {
  return NextResponse.json(
    {
      error: 'CSRF_VALIDATION_FAILED',
      message,
      code: 403,
    } as CSRFErrorResponse,
    { status: 403 }
  );
}

/**
 * Get the full CSRF configuration with defaults
 */
export function getCSRFConfig(config: Partial<CSRFConfig>): CSRFConfig {
  return {
    secret: config.secret || process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || '',
    tokenLength: config.tokenLength ?? CSRF_DEFAULTS.tokenLength,
    cookieName: config.cookieName ?? CSRF_DEFAULTS.cookieName,
    headerName: config.headerName ?? CSRF_DEFAULTS.headerName,
    cookieOptions: {
      ...CSRF_DEFAULTS.cookieOptions,
      ...config.cookieOptions,
    },
    excludePaths: config.excludePaths ?? [],
    excludeSafeMethodsRequests: config.excludeSafeMethodsRequests ?? CSRF_DEFAULTS.excludeSafeMethodsRequests,
  };
}

/**
 * Validate CSRF token from request
 * 
 * Uses double-submit cookie pattern:
 * - Token is stored in a cookie
 * - Token must also be sent in header
 * - Both must match
 */
export function validateCSRFRequest(
  request: NextRequest,
  config: CSRFConfig
): { valid: boolean; error?: string } {
  const { cookieName = CSRF_DEFAULTS.cookieName, headerName = CSRF_DEFAULTS.headerName, secret } = config;

  // Get token from cookie
  const cookieToken = request.cookies.get(cookieName)?.value;

  // Get token from header
  const headerToken = request.headers.get(headerName);

  // Validate using double-submit pattern
  const result = validateDoubleSubmitToken(cookieToken, headerToken, secret);

  return result;
}

/**
 * Create CSRF middleware for Next.js
 * 
 * @param config - CSRF configuration
 * @returns Middleware function
 */
export function createCSRFMiddleware(config: Partial<CSRFConfig> = {}) {
  const fullConfig = getCSRFConfig(config);

  return function csrfMiddleware(request: NextRequest): NextResponse | null {
    const { pathname } = request.nextUrl;
    const method = request.method;

    // Skip safe methods if configured
    if (fullConfig.excludeSafeMethodsRequests && isSafeMethod(method)) {
      return null;
    }

    // Skip excluded paths
    if (isExcludedPath(pathname, fullConfig.excludePaths)) {
      return null;
    }

    // Validate CSRF token
    const validation = validateCSRFRequest(request, fullConfig);

    if (!validation.valid) {
      return createCSRFErrorResponse(validation.error || 'CSRF validation failed');
    }

    return null;
  };
}

/**
 * Set CSRF token cookie on response
 * 
 * @param response - The response to add cookie to
 * @param config - CSRF configuration
 * @returns The token that was set
 */
export function setCSRFCookie(
  response: NextResponse,
  config: Partial<CSRFConfig> = {}
): string {
  const fullConfig = getCSRFConfig(config);
  const token = generateDoubleSubmitToken(fullConfig.secret);
  const cookieName = fullConfig.cookieName || CSRF_DEFAULTS.cookieName;
  const cookieOptions = fullConfig.cookieOptions || CSRF_DEFAULTS.cookieOptions;

  response.cookies.set(cookieName, token, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
    maxAge: cookieOptions.maxAge,
  });

  return token;
}

/**
 * Get or create CSRF token from request/response
 * 
 * If token exists in cookie, returns it.
 * Otherwise, generates new token and sets cookie.
 */
export function getOrCreateCSRFToken(
  request: NextRequest,
  response: NextResponse,
  config: Partial<CSRFConfig> = {}
): string {
  const fullConfig = getCSRFConfig(config);
  const cookieName = fullConfig.cookieName || CSRF_DEFAULTS.cookieName;
  
  // Check for existing token
  const existingToken = request.cookies.get(cookieName)?.value;
  
  if (existingToken) {
    // Validate the existing token is still valid
    const result = validateDoubleSubmitToken(existingToken, existingToken, fullConfig.secret);
    if (result.valid) {
      return existingToken;
    }
  }

  // Generate new token
  return setCSRFCookie(response, config);
}

/**
 * CSRF protection handler for API routes
 * 
 * Use this in individual API routes for fine-grained control.
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfError = validateCSRFForRoute(request);
 *   if (csrfError) return csrfError;
 *   
 *   // Handle request...
 * }
 * ```
 */
export function validateCSRFForRoute(
  request: NextRequest,
  config: Partial<CSRFConfig> = {}
): NextResponse | null {
  const fullConfig = getCSRFConfig(config);

  // Skip safe methods
  if (isSafeMethod(request.method)) {
    return null;
  }

  const validation = validateCSRFRequest(request, fullConfig);

  if (!validation.valid) {
    return createCSRFErrorResponse(validation.error || 'CSRF validation failed');
  }

  return null;
}

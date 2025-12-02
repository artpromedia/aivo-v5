import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createHmac } from "crypto";

// Paths that don't require onboarding completion
const ONBOARDING_EXEMPT_PATHS = [
  "/onboarding",
  "/api/onboarding",
  "/login",
  "/register",
  "/logout",
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/static",
];

// Paths exempt from rate limiting (health checks, internal)
const RATE_LIMIT_EXEMPT_PATHS = [
  "/api/health",
  "/api/ready",
  "/api/metrics",
  "/_next",
  "/favicon.ico",
];

// Paths exempt from CSRF validation
const CSRF_EXEMPT_PATHS = [
  "/api/auth/",
  "/api/health",
  "/api/ready",
  "/api/webhooks/",
  "/api/csrf",
  "/_next/",
];

// HTTP methods that don't require CSRF protection
const CSRF_SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

// CSRF configuration
const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Check if path is exempt from onboarding
function isOnboardingExempt(pathname: string): boolean {
  return ONBOARDING_EXEMPT_PATHS.some(path => pathname.startsWith(path));
}

// Check if path is exempt from rate limiting
function isRateLimitExempt(pathname: string): boolean {
  return RATE_LIMIT_EXEMPT_PATHS.some(path => pathname.startsWith(path));
}

// Check if path is exempt from CSRF protection
function isCSRFExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some(path => pathname.startsWith(path));
}

// Check for internal API key bypass
function hasInternalApiKey(headers: Headers): boolean {
  const internalApiKeys = (process.env.INTERNAL_API_KEYS || '').split(',').filter(Boolean);
  const providedKey = headers.get('x-internal-api-key');
  return providedKey ? internalApiKeys.includes(providedKey) : false;
}

// Generate CSRF token using HMAC-SHA256
function generateCSRFToken(): { token: string; timestamp: number } {
  const secret = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'csrf-secret-key';
  const timestamp = Date.now();
  const payload = `${timestamp}:${Math.random().toString(36).substring(2)}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return {
    token: `${payload}:${signature}`,
    timestamp,
  };
}

// Validate CSRF token
function validateCSRFToken(token: string, cookieToken: string): boolean {
  if (!token || !cookieToken) return false;
  
  // Double-submit pattern: token must match cookie
  if (token !== cookieToken) return false;
  
  // Validate token structure and signature
  const parts = token.split(':');
  if (parts.length < 3) return false;
  
  const [timestampStr, random, signature] = [parts[0], parts[1], parts.slice(2).join(':')];
  const timestamp = parseInt(timestampStr, 10);
  
  // Check token age
  if (Date.now() - timestamp > CSRF_TOKEN_MAX_AGE) return false;
  
  // Verify signature
  const secret = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'csrf-secret-key';
  const payload = `${timestampStr}:${random}`;
  const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');
  
  return signature === expectedSignature;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();

  // Add security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CSRF Protection for state-changing requests
  if (pathname.startsWith('/api') && !CSRF_SAFE_METHODS.includes(req.method)) {
    // Skip CSRF check for exempt paths or internal API calls
    if (!isCSRFExempt(pathname) && !hasInternalApiKey(req.headers)) {
      const headerToken = req.headers.get(CSRF_HEADER_NAME);
      const cookieToken = req.cookies?.get(CSRF_COOKIE_NAME)?.value;

      if (!headerToken || !cookieToken || !validateCSRFToken(headerToken, cookieToken)) {
        return new NextResponse(
          JSON.stringify({
            error: 'CSRF validation failed',
            code: 'CSRF_TOKEN_INVALID',
            message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'X-Content-Type-Options': 'nosniff',
            },
          }
        );
      }
    }
  }

  // Ensure CSRF cookie exists for authenticated users on page requests
  if (req.auth && req.cookies && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    const existingCookie = req.cookies.get(CSRF_COOKIE_NAME);
    if (!existingCookie) {
      const { token } = generateCSRFToken();
      response.cookies.set(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Must be readable by JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: CSRF_TOKEN_MAX_AGE / 1000, // Convert to seconds
      });
    }
  }

  // For API routes, add rate limit info headers (actual limiting done per-route)
  if (pathname.startsWith('/api') && !isRateLimitExempt(pathname)) {
    // Skip if internal API key provided
    if (!hasInternalApiKey(req.headers)) {
      // Note: Actual rate limiting is done in individual API routes
      // This middleware just adds common headers and checks
      response.headers.set('X-RateLimit-Policy', 'sliding-window');
    }
  }

  // Allow unauthenticated access to public paths
  if (!req.auth || !req.auth.user) {
    // Don't redirect for API routes or public assets
    if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return response;
    }
    // Don't redirect if already on login/register page
    if (pathname === "/login" || pathname === "/register") {
      return response;
    }
    const signInUrl = new URL("/login", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = req.auth.user?.role;
  const onboardingStatus = (req.auth.user as any)?.onboardingStatus;

  // Skip onboarding check for exempt paths
  if (!isOnboardingExempt(pathname)) {
    // If onboarding is not complete, redirect to onboarding
    // Note: This requires the onboardingStatus to be in the session
    // You may need to add this to your auth callbacks
    if (onboardingStatus && onboardingStatus !== "COMPLETE") {
      return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
    }
  }

  // Role-based access control (only if role is defined)
  if (role) {
    if (pathname.startsWith("/learners") && role === "LEARNER") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }

    // Block learners from admin routes
    if (pathname.startsWith("/admin") && role === "LEARNER") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  return response;
});

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/learners/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/api/:path*",
  ]
};

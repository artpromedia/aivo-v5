import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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

// Check if path is exempt from onboarding
function isOnboardingExempt(pathname: string): boolean {
  return ONBOARDING_EXEMPT_PATHS.some(path => pathname.startsWith(path));
}

// Check if path is exempt from rate limiting
function isRateLimitExempt(pathname: string): boolean {
  return RATE_LIMIT_EXEMPT_PATHS.some(path => pathname.startsWith(path));
}

// Check for internal API key bypass
function hasInternalApiKey(headers: Headers): boolean {
  const internalApiKeys = (process.env.INTERNAL_API_KEYS || '').split(',').filter(Boolean);
  const providedKey = headers.get('x-internal-api-key');
  return providedKey ? internalApiKeys.includes(providedKey) : false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();

  // Add security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

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
  if (!req.auth) {
    // Don't redirect for API routes or public assets
    if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return response;
    }
    const signInUrl = new URL("/login", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = req.auth.user.role;
  const onboardingStatus = (req.auth.user as any).onboardingStatus;

  // Skip onboarding check for exempt paths
  if (!isOnboardingExempt(pathname)) {
    // If onboarding is not complete, redirect to onboarding
    // Note: This requires the onboardingStatus to be in the session
    // You may need to add this to your auth callbacks
    if (onboardingStatus && onboardingStatus !== "COMPLETE") {
      return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
    }
  }

  // Role-based access control
  if (pathname.startsWith("/learners") && role === "LEARNER") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // Block learners from admin routes
  if (pathname.startsWith("/admin") && role === "LEARNER") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return response;
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learners/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/api/:path*",
  ]
};

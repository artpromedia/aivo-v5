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

// Check if path is exempt from onboarding
function isOnboardingExempt(pathname: string): boolean {
  return ONBOARDING_EXEMPT_PATHS.some(path => pathname.startsWith(path));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow unauthenticated access to public paths
  if (!req.auth) {
    // Don't redirect for API routes or public assets
    if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return NextResponse.next();
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

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learners/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
  ]
};

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Simple dev-only middleware to inject x-aivo-user header when talking to the API gateway.
// This keeps admin flows clickable without manual header tweaking.

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Only apply in development to avoid surprising behavior in prod/staging.
  if (process.env.NODE_ENV !== "development") {
    return res;
  }

  const url = req.nextUrl;

  // For tenant admin overview, simulate a district admin.
  if (url.pathname.startsWith("/tenant")) {
    res.headers.set("x-aivo-user", "district_admin");
  }

  // For platform admin tenants view, simulate a platform admin.
  if (url.pathname.startsWith("/tenants")) {
    res.headers.set("x-aivo-user", "platform_admin");
  }

  return res;
}

// Optionally restrict middleware to the admin routes we care about.
export const config = {
  matcher: ["/tenant/:path*", "/tenants/:path*"]
};

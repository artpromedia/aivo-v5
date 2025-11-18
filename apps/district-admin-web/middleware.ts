import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();

  if (process.env.NODE_ENV !== "development") {
    return res;
  }

  // District admin app always simulates a district_admin user.
  res.headers.set("x-aivo-user", "district_admin");
  return res;
}

export const config = {
  matcher: ["/:path*"]
};

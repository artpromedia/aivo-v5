import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/login", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = req.auth.user.role;

  if (req.nextUrl.pathname.startsWith("/learners") && role === "LEARNER") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/learners/:path*"]
};

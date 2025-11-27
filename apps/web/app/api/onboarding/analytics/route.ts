/**
 * GET /api/onboarding/analytics
 * Get onboarding analytics (admin only)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getOnboardingMetrics,
  getUsersWithIncompleteOnboarding,
} from "@aivo/persistence";
import type { Role } from "@aivo/types";

export const runtime = "nodejs";

// Admin roles that can view analytics
const ADMIN_ROLES: Role[] = [
  "SUPER_ADMIN",
  "GLOBAL_ADMIN",
  "DISTRICT_ADMIN",
  "SCHOOL_ADMIN",
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: Role }).role;
    
    // Check if user has admin permissions
    if (!userRole || !ADMIN_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId") || undefined;
    const includeUsers = searchParams.get("includeUsers") === "true";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Get metrics
    const metrics = await getOnboardingMetrics(organizationId);

    // Optionally include users with incomplete onboarding
    let incompleteUsers = null;
    if (includeUsers) {
      incompleteUsers = await getUsersWithIncompleteOnboarding({
        organizationId,
        limit,
        offset,
      });
    }

    return NextResponse.json({
      metrics,
      ...(incompleteUsers && { incompleteUsers }),
    });
  } catch (error) {
    console.error("Error fetching onboarding analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding analytics" },
      { status: 500 }
    );
  }
}

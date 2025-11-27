/**
 * POST /api/onboarding/reset
 * Reset onboarding for a user (admin only)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resetOnboarding } from "@aivo/persistence";
import type { ResetOnboardingResponse, Role } from "@aivo/types";
import { hasPermission, ROLE_PERMISSIONS } from "@aivo/types";

export const runtime = "nodejs";

// Admin roles that can reset onboarding
const ADMIN_ROLES: Role[] = [
  "SUPER_ADMIN",
  "GLOBAL_ADMIN",
  "TECH_SUPPORT",
  "DISTRICT_ADMIN",
  "SCHOOL_ADMIN",
];

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const targetUserId = body.userId as string;
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const state = await resetOnboarding(targetUserId);

    const response: ResetOnboardingResponse = {
      success: true,
      state,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error resetting onboarding:", error);
    return NextResponse.json(
      { error: "Failed to reset onboarding" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/onboarding/status
 * Get the current user's onboarding status and state
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getOnboardingState,
  initializeOnboarding,
  getOnboardingProgress,
} from "@aivo/persistence";
import type { GetOnboardingStatusResponse, Role } from "@aivo/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    let state = await getOnboardingState(userId);

    // If no onboarding state exists, initialize it
    if (!state) {
      const role = (session.user as { role?: Role }).role || "LEARNER";
      state = await initializeOnboarding(userId, role);
    }

    const progress = await getOnboardingProgress(userId);

    const response: GetOnboardingStatusResponse = {
      status: state.status,
      state,
      progress: progress || {
        currentStep: 1,
        totalSteps: state.steps.length,
        completedSteps: 0,
        skippedSteps: 0,
        progress: 0,
        estimatedTimeRemaining: state.steps.length * 2,
      },
      isComplete: state.status === "COMPLETE",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding/skip-step
 * Skip an optional onboarding step
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  skipOnboardingStep,
  getOnboardingProgress,
} from "@aivo/persistence";
import {
  type SkipStepRequest,
  type SkipStepResponse,
  getNextStep,
} from "@aivo/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json() as SkipStepRequest;
    
    if (!body.stepId) {
      return NextResponse.json(
        { error: "stepId is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const result = await skipOnboardingStep(userId, body.stepId, body.reason);

    if (!result.success) {
      return NextResponse.json(
        { error: "Cannot skip required step" },
        { status: 400 }
      );
    }

    const nextStep = getNextStep(result.state.steps);

    const response: SkipStepResponse = {
      success: true,
      skipped: true,
      nextStep: nextStep?.id || null,
      state: result.state,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error skipping onboarding step:", error);
    return NextResponse.json(
      { error: "Failed to skip onboarding step" },
      { status: 500 }
    );
  }
}

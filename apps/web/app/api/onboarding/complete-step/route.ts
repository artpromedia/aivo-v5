/**
 * POST /api/onboarding/complete-step
 * Mark an onboarding step as complete
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  completeOnboardingStep,
  getOnboardingProgress,
} from "@aivo/persistence";
import {
  type CompleteStepRequest,
  type CompleteStepResponse,
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

    const body = await request.json() as CompleteStepRequest;
    
    if (!body.stepId) {
      return NextResponse.json(
        { error: "stepId is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const state = await completeOnboardingStep(
      userId,
      body.stepId,
      body.timeSpentMs,
      body.metadata
    );

    const progress = await getOnboardingProgress(userId);
    const nextStep = getNextStep(state.steps);

    const response: CompleteStepResponse = {
      success: true,
      nextStep: nextStep?.id || null,
      state,
      progress: progress || {
        currentStep: state.steps.length,
        totalSteps: state.steps.length,
        completedSteps: state.steps.filter(s => s.isCompleted).length,
        skippedSteps: state.steps.filter(s => s.isSkipped).length,
        progress: 100,
        estimatedTimeRemaining: 0,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error completing onboarding step:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding step" },
      { status: 500 }
    );
  }
}

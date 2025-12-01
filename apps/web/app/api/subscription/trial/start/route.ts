import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const TRIAL_DURATION_DAYS = 30;

/**
 * POST /api/subscription/trial/start
 * 
 * Starts a 30-day free trial for the user.
 * Prevents trial reuse if the email has been used before.
 */
export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        trialStartedAt: true,
        trialEndsAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already has an active trial or subscription
    if (user.subscriptionStatus === "TRIAL_ACTIVE") {
      return NextResponse.json(
        { error: "You already have an active trial" },
        { status: 400 }
      );
    }

    if (user.subscriptionStatus === "ACTIVE") {
      return NextResponse.json(
        { error: "You already have an active subscription" },
        { status: 400 }
      );
    }

    // Check if email has been used for a trial before
    if (user.email) {
      const usedEmail = await prisma.trialUsedEmail.findUnique({
        where: { email: user.email },
      });

      if (usedEmail) {
        return NextResponse.json(
          { 
            error: "This email has already been used for a trial. Please subscribe to continue using Aivo.",
            code: "TRIAL_ALREADY_USED",
          },
          { status: 403 }
        );
      }
    }

    // Calculate trial end date
    const trialStartedAt = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    // Start the trial
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "TRIAL_ACTIVE",
        subscriptionTier: "PRO", // Give full access during trial
        trialStartedAt,
        trialEndsAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Trial started successfully",
      trialStartedAt,
      trialEndsAt,
      daysRemaining: TRIAL_DURATION_DAYS,
    });
  } catch (error) {
    console.error("Error starting trial:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

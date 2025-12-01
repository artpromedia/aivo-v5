import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/subscription/status
 * 
 * Returns the current user's subscription status including trial information.
 */
export async function GET() {
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
        subscriptionTier: true,
        trialStartedAt: true,
        trialEndsAt: true,
        trialCancelledAt: true,
        subscriptionStartedAt: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if email has been used for a trial before
    let hasUsedTrial = false;
    if (user.email) {
      const usedEmail = await prisma.trialUsedEmail.findUnique({
        where: { email: user.email },
      });
      hasUsedTrial = !!usedEmail;
    }

    // Check if trial has expired but status hasn't been updated
    if (
      user.subscriptionStatus === "TRIAL_ACTIVE" &&
      user.trialEndsAt &&
      new Date(user.trialEndsAt) < new Date()
    ) {
      // Update status to expired
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionStatus: "TRIAL_EXPIRED" },
      });

      // Record the email as having used trial
      if (user.email) {
        await prisma.trialUsedEmail.upsert({
          where: { email: user.email },
          create: {
            email: user.email,
            userId: user.id,
            reason: "EXPIRED",
          },
          update: {
            reason: "EXPIRED",
          },
        });
      }

      return NextResponse.json({
        status: "TRIAL_EXPIRED",
        tier: user.subscriptionTier,
        trialStartedAt: user.trialStartedAt,
        trialEndsAt: user.trialEndsAt,
        trialCancelledAt: user.trialCancelledAt,
        subscriptionStartedAt: user.subscriptionStartedAt,
        subscriptionEndsAt: user.subscriptionEndsAt,
        stripeCustomerId: user.stripeCustomerId,
        hasUsedTrial: true,
      });
    }

    return NextResponse.json({
      status: user.subscriptionStatus,
      tier: user.subscriptionTier,
      trialStartedAt: user.trialStartedAt,
      trialEndsAt: user.trialEndsAt,
      trialCancelledAt: user.trialCancelledAt,
      subscriptionStartedAt: user.subscriptionStartedAt,
      subscriptionEndsAt: user.subscriptionEndsAt,
      stripeCustomerId: user.stripeCustomerId,
      hasUsedTrial,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

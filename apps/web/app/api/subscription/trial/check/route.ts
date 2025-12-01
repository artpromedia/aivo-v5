import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const checkSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/subscription/trial/check
 * 
 * Checks if an email can start a trial (hasn't been used before).
 * Used during registration to inform users.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email has been used for a trial
    const usedEmail = await prisma.trialUsedEmail.findUnique({
      where: { email: normalizedEmail },
    });

    if (usedEmail) {
      return NextResponse.json({
        canStartTrial: false,
        reason: "This email has already been used for a trial. You can still subscribe to access the platform.",
      });
    }

    // Check if user exists with this email and already has subscription
    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: {
        subscriptionStatus: true,
        subscriptionTier: true,
      },
    });

    if (existingUser) {
      if (existingUser.subscriptionStatus === "TRIAL_ACTIVE") {
        return NextResponse.json({
          canStartTrial: false,
          reason: "An account with this email already has an active trial.",
          existingSubscription: {
            status: existingUser.subscriptionStatus,
            tier: existingUser.subscriptionTier,
          },
        });
      }

      if (existingUser.subscriptionStatus === "ACTIVE") {
        return NextResponse.json({
          canStartTrial: false,
          reason: "An account with this email already has an active subscription.",
          existingSubscription: {
            status: existingUser.subscriptionStatus,
            tier: existingUser.subscriptionTier,
          },
        });
      }
    }

    return NextResponse.json({
      canStartTrial: true,
    });
  } catch (error) {
    console.error("Error checking trial eligibility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

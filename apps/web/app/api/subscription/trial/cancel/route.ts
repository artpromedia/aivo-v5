import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const cancelSchema = z.object({
  reason: z.string().optional(),
});

/**
 * POST /api/subscription/trial/cancel
 * 
 * Cancels the user's trial. Records the email to prevent trial reuse.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = cancelSchema.safeParse(body);
    const reason = parsed.success ? parsed.data.reason : undefined;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has an active trial
    if (user.subscriptionStatus !== "TRIAL_ACTIVE") {
      return NextResponse.json(
        { error: "No active trial to cancel" },
        { status: 400 }
      );
    }

    // Cancel the trial
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "TRIAL_CANCELLED",
        trialCancelledAt: new Date(),
      },
    });

    // Record the email to prevent trial reuse
    if (user.email) {
      await prisma.trialUsedEmail.upsert({
        where: { email: user.email },
        create: {
          email: user.email,
          userId: user.id,
          reason: reason || "CANCELLED",
        },
        update: {
          reason: reason || "CANCELLED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Trial cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling trial:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

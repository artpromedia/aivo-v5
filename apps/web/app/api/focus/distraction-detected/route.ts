import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";

const payloadSchema = z.object({
  learnerId: z.string().optional(),
  type: z.string().default("unknown"),
  metrics: z
    .object({
      focusScore: z.number().optional(),
      distractionCount: z.number().optional(),
      sessionDuration: z.number().optional(),
      lastActivity: z.union([z.string(), z.date()]).optional()
    })
    .optional()
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const metrics = parsed.data.metrics;
  await sendNotification({
    userId: session.user.id,
    learnerId: parsed.data.learnerId,
    to: session.user.email ?? undefined,
    subject: "Focus monitor triggered a break",
    template: "focus-alert",
    data: {
      type: parsed.data.type,
      focusScore: metrics?.focusScore,
      distractionCount: metrics?.distractionCount,
      sessionDuration: metrics?.sessionDuration,
      lastActivity: metrics?.lastActivity
    }
  });

  return NextResponse.json({ success: true });
}

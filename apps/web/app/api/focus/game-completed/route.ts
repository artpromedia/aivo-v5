import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";

const payloadSchema = z.object({
  learnerId: z.string().optional(),
  gameType: z.string(),
  duration: z.number().optional(),
  returnedToLearning: z.boolean().optional()
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

  await sendNotification({
    userId: session.user.id,
    learnerId: parsed.data.learnerId,
    to: session.user.email ?? undefined,
    subject: "Focus game completed",
    template: "focus-game",
    data: parsed.data
  });

  return NextResponse.json({ success: true });
}

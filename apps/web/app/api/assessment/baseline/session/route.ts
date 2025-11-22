import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { baselineAssessmentService } from "@/lib/assessments/baseline-service";
import { BASELINE_ASSESSMENT_STATUS_VALUES } from "@/types/baseline";

const patchSchema = z.object({
  sessionId: z.string(),
  status: z.enum(BASELINE_ASSESSMENT_STATUS_VALUES).optional(),
  summary: z.record(z.any()).optional(),
  multiModalPlan: z.record(z.any()).optional()
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const learner = await prisma.learner.findFirst({
    where: { userId: session.user.id },
    select: { id: true }
  });

  if (!learner) {
    return NextResponse.json({ error: "Learner not found" }, { status: 404 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json();
  } catch (error) {
    payload = {};
  }

  const record = await baselineAssessmentService.getOrCreateSession(learner.id, payload.plan as Record<string, unknown> | undefined);
  return NextResponse.json(record);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const learner = await prisma.learner.findFirst({
    where: { userId: session.user.id },
    select: { id: true }
  });

  if (!learner) {
    return NextResponse.json({ error: "Learner not found" }, { status: 404 });
  }

  const payload = patchSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await baselineAssessmentService.updateSessionStatus({
      sessionId: payload.data.sessionId,
      learnerId: learner.id,
      status: payload.data.status,
      summary: payload.data.summary ?? undefined,
      multiModalPlan: payload.data.multiModalPlan ?? undefined
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

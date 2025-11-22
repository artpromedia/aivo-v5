import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { baselineAssessmentService } from "@/lib/assessments/baseline-service";
import { BaselineDomainEnum, type BaselineDomain } from "@/types/baseline";

const payloadSchema = z.object({
  sessionId: z.string(),
  domain: z.string(),
  component: z.string(),
  modality: z.string(),
  responses: z.record(z.any()).optional(),
  score: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  aiNotes: z.string().optional()
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

  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const domain = normalizeDomain(payload.data.domain);
  if (!domain) {
    return NextResponse.json({ error: "Unsupported domain" }, { status: 400 });
  }

  try {
    const record = await baselineAssessmentService.recordDomainResult({
      sessionId: payload.data.sessionId,
      domain,
      component: payload.data.component,
      modality: payload.data.modality,
      responses: payload.data.responses,
      score: payload.data.score,
      confidence: payload.data.confidence,
      aiNotes: payload.data.aiNotes
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

function normalizeDomain(value: string): BaselineDomain | null {
  const key = value.toLowerCase();
  if (key.includes("speech")) return BaselineDomainEnum.SPEECH_LANGUAGE;
  if (key.includes("reading")) return BaselineDomainEnum.READING;
  if (key.includes("math")) return BaselineDomainEnum.MATH;
  if (key.includes("science") || key.includes("social")) return BaselineDomainEnum.SCIENCE_SOCIAL;
  if (key.includes("sel") || key.includes("social-emotional")) return BaselineDomainEnum.SEL;
  return null;
}

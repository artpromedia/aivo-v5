import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { curriculumManager } from "@/lib/curriculum/curriculum-manager";

const adaptationSchema = z.object({
  baseContent: z.string().min(10),
  instructions: z.string().max(500).optional(),
  objective: z.string().max(240).optional(),
  audience: z
    .object({
      modality: z.enum(["TEXT", "AUDIO", "VIDEO", "HAPTIC", "MULTIMODAL"]).default("TEXT"),
      tone: z.enum(["CALM", "EXCITED", "FORMAL", "CASUAL"]).optional(),
      scaffolding: z.enum(["NONE", "LIGHT", "FULL"]).optional(),
      language: z.string().max(10).optional()
    })
    .optional(),
  learner: z
    .object({
      id: z.string().min(1).optional(),
      gradeLevel: z.number().int().min(0).max(12).optional(),
      actualLevel: z.number().min(0).max(12).optional(),
      learningStyle: z.string().optional(),
      strengths: z.array(z.string()).max(10).optional(),
      challenges: z.array(z.string()).max(10).optional(),
      sensoryNeeds: z.array(z.string()).max(10).optional()
    })
    .optional(),
  vocabularyHints: z.array(z.string().min(2)).max(12).optional(),
  examplesToGround: z.array(z.string().min(2)).max(12).optional()
});

export async function POST(request: Request, { params }: { params: { contentId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = adaptationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await curriculumManager.requestAdaptation({
      contentId: params.contentId,
      createdById: session.user.id,
      request: parsed.data
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

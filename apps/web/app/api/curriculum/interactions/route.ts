import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { curriculumManager } from "@/lib/curriculum/curriculum-manager";

const interactionSchema = z.object({
  contentId: z.string().min(1),
  versionId: z.string().min(1).optional(),
  learnerId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  interactionType: z.enum(["VIEW", "DELIVERY", "ASSIGNMENT", "FEEDBACK", "AI_RECOMMENDATION"]),
  modality: z.string().max(32).optional(),
  durationSeconds: z.number().int().min(0).max(7200).optional(),
  feedbackRating: z.number().min(1).max(5).optional(),
  feedbackComment: z.string().max(600).optional(),
  masteryEvidence: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional()
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = interactionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const interaction = await curriculumManager.logInteraction({
      ...parsed.data,
      userId: parsed.data.userId ?? session.user.id
    });
    return NextResponse.json({ interaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

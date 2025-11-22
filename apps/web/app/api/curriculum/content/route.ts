import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { curriculumManager } from "@/lib/curriculum/curriculum-manager";

const contentSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(3).max(140),
  summary: z.string().max(400).optional(),
  contentType: z.enum(["LESSON", "ACTIVITY", "ASSESSMENT", "SUPPORT", "RESOURCE"]),
  difficultyLevel: z.number().min(0).max(12).optional(),
  aiTags: z.array(z.string().min(2)).max(16).optional(),
  standardIds: z.array(z.string().min(1)).max(12).optional()
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = contentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  try {
    const content = await curriculumManager.createContentShell({
      ...payload,
      createdById: session.user.id
    });
    return NextResponse.json({ content }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

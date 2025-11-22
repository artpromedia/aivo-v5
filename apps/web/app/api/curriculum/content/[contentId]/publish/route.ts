import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { curriculumManager } from "@/lib/curriculum/curriculum-manager";

const publishSchema = z.object({
  versionId: z.string().min(1)
});

export async function POST(request: Request, { params }: { params: { contentId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = publishSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await curriculumManager.publishVersion({
      contentId: params.contentId,
      versionId: parsed.data.versionId,
      actorId: session.user.id
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

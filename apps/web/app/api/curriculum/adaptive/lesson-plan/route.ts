import { NextResponse } from "next/server";
import { AdaptiveCurriculumEngine, type Subject } from "@/lib/curriculum/adaptive-engine";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { subject?: string; duration?: number };
  const subject = (typeof body.subject === "string" ? body.subject.toUpperCase() : "READING") as Subject;
  const duration = typeof body.duration === "number" && !Number.isNaN(body.duration) ? body.duration : 14;

  const engine = new AdaptiveCurriculumEngine();
  const plan = await engine.generateLessonPlan(session.user.id, subject, duration);

  return NextResponse.json(plan);
}

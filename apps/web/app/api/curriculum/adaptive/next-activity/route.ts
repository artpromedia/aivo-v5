import { NextResponse } from "next/server";
import { AdaptiveCurriculumEngine, type Skill } from "@/lib/curriculum/adaptive-engine";
import type { LearnerProfile } from "@/lib/types/models";
import { auth } from "@/lib/auth";

interface BodyShape {
  skill?: Skill;
  learnerProfile?: LearnerProfile;
  completedActivities?: string[];
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as BodyShape;

  if (!body.skill || !body.learnerProfile) {
    return NextResponse.json({ error: "Skill and learner profile required" }, { status: 400 });
  }

  const engine = new AdaptiveCurriculumEngine();
  const activity = await engine.selectNextActivity(body.skill, body.learnerProfile, body.completedActivities ?? []);

  return NextResponse.json(activity);
}

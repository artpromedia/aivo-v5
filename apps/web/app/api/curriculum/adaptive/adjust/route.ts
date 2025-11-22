import { NextResponse } from "next/server";
import { AdaptiveCurriculumEngine, type PerformanceMetrics } from "@/lib/curriculum/adaptive-engine";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { sessionId?: string; recentPerformance?: PerformanceMetrics };
  if (!body.sessionId || !body.recentPerformance) {
    return NextResponse.json({ error: "Missing session or performance metrics" }, { status: 400 });
  }

  const engine = new AdaptiveCurriculumEngine();
  const adjustment = await engine.adjustDifficulty(body.sessionId, body.recentPerformance);

  return NextResponse.json(adjustment);
}

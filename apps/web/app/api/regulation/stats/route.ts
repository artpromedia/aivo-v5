/**
 * Regulation Stats API Route
 * Returns learner's regulation statistics and progress
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRegulationStats } from "@aivo/persistence";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getRegulationStats(session.user.id);

    return NextResponse.json({
      totalSessions: stats.totalSessions,
      completedSessions: stats.completedSessions,
      averageEffectiveness: stats.averageEffectiveness,
      totalMinutes: stats.totalMinutes,
      activityBreakdown: stats.activityBreakdown,
      mostEffectiveActivity: stats.mostEffectiveActivity ?? undefined,
      emotionImprovementRate: stats.emotionImprovementRate,
    });
  } catch (error) {
    console.error("Error fetching regulation stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch regulation stats" },
      { status: 500 }
    );
  }
}

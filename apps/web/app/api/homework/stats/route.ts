/**
 * Homework Stats API Route
 * 
 * GET - Get homework statistics for a learner
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getHomeworkStatsForLearner } from "@aivo/persistence";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const learnerId = searchParams.get("learnerId");
    const daysBack = parseInt(searchParams.get("days") || "30");

    if (!learnerId) {
      return NextResponse.json(
        { error: "Missing required parameter: learnerId" },
        { status: 400 }
      );
    }

    const stats = await getHomeworkStatsForLearner(learnerId, daysBack);

    return NextResponse.json({
      stats: {
        ...stats,
        recentSessions: stats.recentSessions.map(s => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          completedAt: s.completedAt?.toISOString() ?? null
        }))
      }
    });
  } catch (error) {
    console.error("Get homework stats error:", error);
    return NextResponse.json(
      { error: "Failed to get homework stats" },
      { status: 500 }
    );
  }
}

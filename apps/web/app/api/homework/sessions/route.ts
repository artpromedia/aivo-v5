/**
 * Homework Sessions API Route
 * 
 * POST - Create new homework session
 * GET - List homework sessions for a learner
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  createHomeworkSession, 
  listHomeworkSessionsForLearner 
} from "@aivo/persistence";
import type { 
  CreateHomeworkSessionRequest,
  HomeworkSessionStatus 
} from "@aivo/api-client/src/homework-contracts";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: CreateHomeworkSessionRequest = await request.json();
    
    if (!body.learnerId || !body.title) {
      return NextResponse.json(
        { error: "Missing required fields: learnerId, title" },
        { status: 400 }
      );
    }

    const homeworkSession = await createHomeworkSession({
      learnerId: body.learnerId,
      title: body.title,
      subject: body.subject,
      gradeLevel: body.gradeLevel,
      difficultyMode: body.difficultyMode ?? "SCAFFOLDED",
      parentAssistMode: body.parentAssistMode ?? false
    });

    return NextResponse.json({
      session: {
        ...homeworkSession,
        createdAt: homeworkSession.createdAt.toISOString(),
        updatedAt: homeworkSession.updatedAt.toISOString(),
        completedAt: homeworkSession.completedAt?.toISOString() ?? null
      }
    });
  } catch (error) {
    console.error("Create homework session error:", error);
    return NextResponse.json(
      { error: "Failed to create homework session" },
      { status: 500 }
    );
  }
}

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
    const status = searchParams.get("status") as HomeworkSessionStatus | null;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!learnerId) {
      return NextResponse.json(
        { error: "Missing required parameter: learnerId" },
        { status: 400 }
      );
    }

    const result = await listHomeworkSessionsForLearner(learnerId, {
      status: status || undefined,
      limit,
      offset
    });

    return NextResponse.json({
      sessions: result.sessions.map(s => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        completedAt: s.completedAt?.toISOString() ?? null
      })),
      total: result.total
    });
  } catch (error) {
    console.error("List homework sessions error:", error);
    return NextResponse.json(
      { error: "Failed to list homework sessions" },
      { status: 500 }
    );
  }
}

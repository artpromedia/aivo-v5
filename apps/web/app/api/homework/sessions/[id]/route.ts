/**
 * Individual Homework Session API Route
 * 
 * GET - Get homework session by ID
 * PATCH - Update homework session
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  getHomeworkSessionById, 
  updateHomeworkSession 
} from "@aivo/persistence";
import type { 
  UpdateHomeworkSessionRequest
} from "@aivo/api-client/src/homework-contracts";

interface HomeworkFileRecord {
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

interface HomeworkWorkProductRecord {
  createdAt: Date;
  [key: string]: unknown;
}

interface HomeworkHintRecord {
  createdAt: Date;
  [key: string]: unknown;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const homeworkSession = await getHomeworkSessionById(id);

    if (!homeworkSession) {
      return NextResponse.json(
        { error: "Homework session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session: {
        ...homeworkSession,
        createdAt: homeworkSession.createdAt.toISOString(),
        updatedAt: homeworkSession.updatedAt.toISOString(),
        completedAt: homeworkSession.completedAt?.toISOString() ?? null,
        files: (homeworkSession.files as HomeworkFileRecord[] | undefined)?.map((f: HomeworkFileRecord) => ({
          ...f,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString()
        })),
        workProducts: (homeworkSession.workProducts as HomeworkWorkProductRecord[] | undefined)?.map((wp: HomeworkWorkProductRecord) => ({
          ...wp,
          createdAt: wp.createdAt.toISOString()
        })),
        hints: (homeworkSession.hints as HomeworkHintRecord[] | undefined)?.map((h: HomeworkHintRecord) => ({
          ...h,
          createdAt: h.createdAt.toISOString()
        }))
      }
    });
  } catch (error) {
    console.error("Get homework session error:", error);
    return NextResponse.json(
      { error: "Failed to get homework session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: UpdateHomeworkSessionRequest = await request.json();

    const updated = await updateHomeworkSession(id, {
      status: body.status,
      difficultyMode: body.difficultyMode,
      parentAssistMode: body.parentAssistMode,
      problemAnalysis: body.problemAnalysis ? JSON.stringify(body.problemAnalysis) : undefined,
      solutionPlan: body.solutionPlan ? JSON.stringify(body.solutionPlan) : undefined,
      finalAnswer: body.finalAnswer ? JSON.stringify(body.finalAnswer) : undefined,
      verificationResult: body.verificationResult ? JSON.stringify(body.verificationResult) : undefined,
      completedAt: body.status === "COMPLETE" ? new Date() : undefined
    });

    return NextResponse.json({
      session: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        completedAt: updated.completedAt?.toISOString() ?? null
      }
    });
  } catch (error) {
    console.error("Update homework session error:", error);
    return NextResponse.json(
      { error: "Failed to update homework session" },
      { status: 500 }
    );
  }
}

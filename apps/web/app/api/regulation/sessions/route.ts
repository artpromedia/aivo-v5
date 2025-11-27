/**
 * Self-Regulation Sessions API Route
 * Handles creation and listing of regulation sessions
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createRegulationSession,
  listRegulationSessions,
} from "@aivo/persistence";
import type { RegulationActivityType } from "@prisma/client";

interface CreateSessionBody {
  activityId: string;
  activityType: RegulationActivityType;
  emotionBefore?: string;
  emotionLevelBefore?: number;
  triggeredBy?: string;
  context?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateSessionBody;

    // Validate required fields
    if (!body.activityType || !body.activityId) {
      return NextResponse.json(
        { error: "Missing required fields: activityType and activityId" },
        { status: 400 }
      );
    }

    // Validate emotion level range (1-5) if provided
    if (body.emotionLevelBefore !== undefined && 
        (body.emotionLevelBefore < 1 || body.emotionLevelBefore > 5)) {
      return NextResponse.json(
        { error: "emotionLevelBefore must be between 1 and 5" },
        { status: 400 }
      );
    }

    const regulationSession = await createRegulationSession({
      learnerId: session.user.id,
      activityId: body.activityId,
      activityType: body.activityType,
      emotionBefore: body.emotionBefore,
      emotionLevelBefore: body.emotionLevelBefore,
      triggeredBy: body.triggeredBy,
      context: body.context,
    });

    return NextResponse.json({ session: regulationSession }, { status: 201 });
  } catch (error) {
    console.error("Error creating regulation session:", error);
    return NextResponse.json(
      { error: "Failed to create regulation session" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);
    const activityType = searchParams.get("activityType") as RegulationActivityType | null;
    const completed = searchParams.get("completed");

    const result = await listRegulationSessions(session.user.id, {
      limit,
      offset,
      activityType: activityType ?? undefined,
      completed: completed !== null ? completed === "true" : undefined,
    });

    return NextResponse.json({
      sessions: result.sessions,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error listing regulation sessions:", error);
    return NextResponse.json(
      { error: "Failed to list regulation sessions" },
      { status: 500 }
    );
  }
}

/**
 * Emotion Check-in API Route
 * Handles logging and listing emotion records
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  logEmotion,
  getEmotionHistory,
} from "@aivo/persistence";

interface LogEmotionBody {
  emotion: string;
  level: number;
  trigger?: string;
  strategy?: string;
  context?: Record<string, unknown>;
  source?: string;
  notifyParent?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as LogEmotionBody;

    // Validate required fields
    if (!body.emotion || typeof body.level !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: emotion and level" },
        { status: 400 }
      );
    }

    // Validate level range (1-5)
    if (body.level < 1 || body.level > 5) {
      return NextResponse.json(
        { error: "level must be between 1 and 5" },
        { status: 400 }
      );
    }

    const emotionRecord = await logEmotion({
      learnerId: session.user.id,
      emotion: body.emotion,
      level: body.level,
      trigger: body.trigger,
      strategy: body.strategy,
      context: body.context,
      source: body.source,
      notifyParent: body.notifyParent,
    });

    return NextResponse.json({ emotion: emotionRecord }, { status: 201 });
  } catch (error) {
    console.error("Error logging emotion:", error);
    return NextResponse.json(
      { error: "Failed to log emotion" },
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
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);
    const emotion = searchParams.get("emotion") ?? undefined;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const result = await getEmotionHistory(session.user.id, {
      emotion,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json({
      emotions: result.records,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error listing emotion history:", error);
    return NextResponse.json(
      { error: "Failed to list emotion history" },
      { status: 500 }
    );
  }
}

/**
 * Self-Regulation Session Detail API Route
 * Handles updating and completing individual regulation sessions
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  updateRegulationSession,
  getRegulationSessionById,
} from "@aivo/persistence";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UpdateSessionBody {
  emotionAfter?: string;
  emotionLevelAfter?: number;
  durationSeconds?: number;
  completed?: boolean;
  effectiveness?: number;
  notes?: string;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateSessionBody;

    // Validate emotion level range if provided
    if (body.emotionLevelAfter !== undefined && 
        (body.emotionLevelAfter < 1 || body.emotionLevelAfter > 5)) {
      return NextResponse.json(
        { error: "emotionLevelAfter must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate effectiveness range if provided
    if (body.effectiveness !== undefined && 
        (body.effectiveness < 1 || body.effectiveness > 5)) {
      return NextResponse.json(
        { error: "effectiveness must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if session exists and belongs to user
    const existingSession = await getRegulationSessionById(id);
    if (!existingSession) {
      return NextResponse.json(
        { error: "Regulation session not found" },
        { status: 404 }
      );
    }
    if (existingSession.learnerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const regulationSession = await updateRegulationSession(id, {
      emotionAfter: body.emotionAfter,
      emotionLevelAfter: body.emotionLevelAfter,
      durationSeconds: body.durationSeconds,
      completed: body.completed,
      effectiveness: body.effectiveness,
      notes: body.notes,
    });

    return NextResponse.json({ session: regulationSession });
  } catch (error) {
    console.error("Error updating regulation session:", error);
    return NextResponse.json(
      { error: "Failed to update regulation session" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateSessionBody;

    // Check if session exists and belongs to user
    const existingSession = await getRegulationSessionById(id);
    if (!existingSession) {
      return NextResponse.json(
        { error: "Regulation session not found" },
        { status: 404 }
      );
    }
    if (existingSession.learnerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For PATCH, mark as completed with completion data
    const regulationSession = await updateRegulationSession(id, {
      ...body,
      completed: true,
      completedAt: new Date(),
    });

    return NextResponse.json({ session: regulationSession });
  } catch (error) {
    console.error("Error completing regulation session:", error);
    return NextResponse.json(
      { error: "Failed to complete regulation session" },
      { status: 500 }
    );
  }
}

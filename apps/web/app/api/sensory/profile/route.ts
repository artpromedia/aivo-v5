/**
 * Sensory Profile API Route
 * Handles fetching and updating the current user's sensory profile
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSensoryProfile,
  upsertSensoryProfile,
  type UpdateSensoryProfileInput,
} from "@aivo/persistence";
import { SENSORY_PRESETS } from "@aivo/api-client/src/sensory-contracts";

/**
 * GET /api/sensory/profile
 * Get the current user's sensory profile
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getSensoryProfile(session.user.id);

    return NextResponse.json({
      profile,
      presets: SENSORY_PRESETS,
    });
  } catch (error) {
    console.error("Error fetching sensory profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch sensory profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sensory/profile
 * Update the current user's sensory profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateSensoryProfileInput;

    // Validate settings if provided
    if (body.visual?.fontSize && !["small", "medium", "large", "x-large"].includes(body.visual.fontSize)) {
      return NextResponse.json(
        { error: "Invalid fontSize value" },
        { status: 400 }
      );
    }

    if (body.visual?.fontFamily && !["default", "dyslexic", "sans-serif", "serif"].includes(body.visual.fontFamily)) {
      return NextResponse.json(
        { error: "Invalid fontFamily value" },
        { status: 400 }
      );
    }

    if (body.auditory?.soundVolume !== undefined && (body.auditory.soundVolume < 0 || body.auditory.soundVolume > 100)) {
      return NextResponse.json(
        { error: "soundVolume must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (body.cognitive?.timeMultiplier !== undefined && (body.cognitive.timeMultiplier < 1 || body.cognitive.timeMultiplier > 3)) {
      return NextResponse.json(
        { error: "timeMultiplier must be between 1 and 3" },
        { status: 400 }
      );
    }

    const profile = await upsertSensoryProfile(session.user.id, body);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error updating sensory profile:", error);
    return NextResponse.json(
      { error: "Failed to update sensory profile" },
      { status: 500 }
    );
  }
}

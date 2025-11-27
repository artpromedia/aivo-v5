/**
 * Apply Sensory Preset API Route
 * Applies a preset to a learner's sensory profile
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyPreset } from "@aivo/persistence";
import { SENSORY_PRESETS, type PresetId } from "@aivo/api-client/src/sensory-contracts";

interface ApplyPresetBody {
  learnerId: string;
  presetId: PresetId;
  customizations?: {
    visual?: Record<string, unknown>;
    auditory?: Record<string, unknown>;
    motor?: Record<string, unknown>;
    cognitive?: Record<string, unknown>;
    environment?: Record<string, unknown>;
    triggers?: Record<string, unknown>;
  };
}

/**
 * POST /api/sensory/apply-preset
 * Apply a preset to a learner's sensory profile
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ApplyPresetBody;

    // Validate required fields
    if (!body.learnerId || !body.presetId) {
      return NextResponse.json(
        { error: "Missing required fields: learnerId and presetId" },
        { status: 400 }
      );
    }

    // Find the preset
    const preset = SENSORY_PRESETS.find((p) => p.id === body.presetId);
    if (!preset) {
      return NextResponse.json(
        { error: `Invalid presetId: ${body.presetId}` },
        { status: 400 }
      );
    }

    // Apply preset with optional customizations
    const profile = await applyPreset(
      body.learnerId,
      body.presetId,
      preset.settings,
      body.customizations
    );

    return NextResponse.json({
      profile,
      appliedPreset: preset,
    });
  } catch (error) {
    console.error("Error applying sensory preset:", error);
    return NextResponse.json(
      { error: "Failed to apply sensory preset" },
      { status: 500 }
    );
  }
}

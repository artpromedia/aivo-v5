/**
 * Sensory Profile Presets API Route
 * Returns available sensory profile presets
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SENSORY_PRESETS } from "@aivo/api-client/src/sensory-contracts";

/**
 * GET /api/sensory/presets
 * Get all available sensory profile presets
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Group presets by category
    const presetsByCategory = SENSORY_PRESETS.reduce(
      (acc, preset) => {
        if (!acc[preset.category]) {
          acc[preset.category] = [];
        }
        acc[preset.category].push(preset);
        return acc;
      },
      {} as Record<string, typeof SENSORY_PRESETS>
    );

    return NextResponse.json({
      presets: SENSORY_PRESETS,
      byCategory: presetsByCategory,
      categories: ["neurodiversity", "sensory", "motor", "cognitive"],
    });
  } catch (error) {
    console.error("Error fetching sensory presets:", error);
    return NextResponse.json(
      { error: "Failed to fetch sensory presets" },
      { status: 500 }
    );
  }
}

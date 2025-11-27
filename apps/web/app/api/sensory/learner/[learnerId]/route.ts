/**
 * Sensory Profile for Learner API Route
 * Handles fetching and updating sensory profiles for specific learners (for educators/parents)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSensoryProfile,
  upsertSensoryProfile,
  type UpdateSensoryProfileInput,
} from "@aivo/persistence";
import { SENSORY_PRESETS } from "@aivo/api-client/src/sensory-contracts";
import { prisma } from "@aivo/persistence";

interface RouteParams {
  params: Promise<{ learnerId: string }>;
}

/**
 * Check if user has permission to access learner's profile
 */
async function hasLearnerAccess(userId: string, learnerId: string): Promise<boolean> {
  // Check if user is the learner themselves
  if (userId === learnerId) return true;

  // Check if user is a parent/guardian of the learner
  const learner = await prisma.learner.findUnique({
    where: { id: learnerId },
    select: { ownerId: true },
  });

  if (learner?.ownerId === userId) return true;

  // Check if user has a teacher/admin role (could add more sophisticated role checking)
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    select: { role: true },
  });

  const adminRoles = ["SUPER_ADMIN", "GLOBAL_ADMIN", "DISTRICT_ADMIN", "SCHOOL_ADMIN"];
  const hasElevatedRole = userRoles.some(
    (r) => r.role === "TEACHER" || r.role === "THERAPIST" || adminRoles.includes(r.role)
  );

  return hasElevatedRole;
}

/**
 * GET /api/sensory/learner/[learnerId]
 * Get a learner's sensory profile
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { learnerId } = await params;

    // Check permissions
    const hasAccess = await hasLearnerAccess(session.user.id, learnerId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have permission to view this learner's profile" },
        { status: 403 }
      );
    }

    const profile = await getSensoryProfile(learnerId);

    return NextResponse.json({
      profile,
      presets: SENSORY_PRESETS,
    });
  } catch (error) {
    console.error("Error fetching learner sensory profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch sensory profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sensory/learner/[learnerId]
 * Update a learner's sensory profile
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { learnerId } = await params;

    // Check permissions
    const hasAccess = await hasLearnerAccess(session.user.id, learnerId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have permission to modify this learner's profile" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as UpdateSensoryProfileInput;

    // Validate settings
    if (body.visual?.fontSize && !["small", "medium", "large", "x-large"].includes(body.visual.fontSize)) {
      return NextResponse.json(
        { error: "Invalid fontSize value" },
        { status: 400 }
      );
    }

    if (body.auditory?.soundVolume !== undefined && (body.auditory.soundVolume < 0 || body.auditory.soundVolume > 100)) {
      return NextResponse.json(
        { error: "soundVolume must be between 0 and 100" },
        { status: 400 }
      );
    }

    const profile = await upsertSensoryProfile(learnerId, body);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error updating learner sensory profile:", error);
    return NextResponse.json(
      { error: "Failed to update sensory profile" },
      { status: 500 }
    );
  }
}

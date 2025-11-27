/**
 * Sensory Profile Effectiveness API Route
 * Tracks and returns effectiveness metrics for sensory profiles
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSensoryProfile,
  recordEffectivenessCheck,
  getEffectivenessHistory,
} from "@aivo/persistence";

interface RecordEffectivenessBody {
  learnerId: string;
  engagementScore: number;
  completionRate: number;
  averageSessionDuration: number;
}

/**
 * GET /api/sensory/effectiveness
 * Get effectiveness metrics for a learner's sensory profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const learnerId = searchParams.get("learnerId") ?? session.user.id;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const profile = await getSensoryProfile(learnerId);
    if (!profile) {
      return NextResponse.json(
        { error: "No sensory profile found for this learner" },
        { status: 404 }
      );
    }

    const history = await getEffectivenessHistory(
      learnerId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    // Calculate overall score from history
    const overallScore = history.length > 0
      ? history.reduce((sum, h) => sum + h.score, 0) / history.length
      : null;

    // Generate recommendations based on effectiveness
    const recommendations = generateRecommendations(profile, overallScore);

    return NextResponse.json({
      metrics: history.map((h) => ({
        date: h.date.toISOString(),
        score: h.score,
      })),
      overallScore,
      currentSettings: {
        visual: profile.visual,
        auditory: profile.auditory,
        motor: profile.motor,
        cognitive: profile.cognitive,
        environment: profile.environment,
      },
      recommendations,
    });
  } catch (error) {
    console.error("Error fetching effectiveness metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch effectiveness metrics" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sensory/effectiveness
 * Record effectiveness metrics for a learner's sensory profile
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as RecordEffectivenessBody;

    // Validate required fields
    if (!body.learnerId) {
      return NextResponse.json(
        { error: "Missing required field: learnerId" },
        { status: 400 }
      );
    }

    // Validate score ranges
    if (body.engagementScore !== undefined && (body.engagementScore < 0 || body.engagementScore > 100)) {
      return NextResponse.json(
        { error: "engagementScore must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (body.completionRate !== undefined && (body.completionRate < 0 || body.completionRate > 100)) {
      return NextResponse.json(
        { error: "completionRate must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Calculate composite score
    const compositeScore = calculateCompositeScore(body);

    // Record the effectiveness check
    const profile = await recordEffectivenessCheck(body.learnerId, compositeScore);

    if (!profile) {
      return NextResponse.json(
        { error: "No sensory profile found for this learner" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile,
      recordedScore: compositeScore,
      recommendations: generateRecommendations(profile, compositeScore),
    });
  } catch (error) {
    console.error("Error recording effectiveness metrics:", error);
    return NextResponse.json(
      { error: "Failed to record effectiveness metrics" },
      { status: 500 }
    );
  }
}

/**
 * Calculate composite effectiveness score
 */
function calculateCompositeScore(data: RecordEffectivenessBody): number {
  const weights = {
    engagement: 0.4,
    completion: 0.4,
    duration: 0.2,
  };

  let score = 0;
  let totalWeight = 0;

  if (data.engagementScore !== undefined) {
    score += data.engagementScore * weights.engagement;
    totalWeight += weights.engagement;
  }

  if (data.completionRate !== undefined) {
    score += data.completionRate * weights.completion;
    totalWeight += weights.completion;
  }

  if (data.averageSessionDuration !== undefined) {
    // Normalize session duration (assuming 30 min is optimal = 100%)
    const normalizedDuration = Math.min((data.averageSessionDuration / 30) * 100, 100);
    score += normalizedDuration * weights.duration;
    totalWeight += weights.duration;
  }

  return totalWeight > 0 ? Math.round(score / totalWeight) : 50;
}

/**
 * Generate recommendations based on profile and effectiveness score
 */
function generateRecommendations(
  profile: { visual: Record<string, unknown>; cognitive: Record<string, unknown> },
  score: number | null
): string[] {
  const recommendations: string[] = [];

  if (score === null) {
    recommendations.push("Continue using your current settings and check back after a few sessions for recommendations.");
    return recommendations;
  }

  if (score < 50) {
    recommendations.push("Your effectiveness score is low. Consider trying a different preset or adjusting your settings.");
    
    // Check specific settings
    if (!profile.cognitive.breakReminders) {
      recommendations.push("Try enabling break reminders to maintain focus during longer sessions.");
    }
    
    if (!profile.visual.reduceAnimations) {
      recommendations.push("Consider reducing animations if you find the interface distracting.");
    }
  } else if (score < 75) {
    recommendations.push("Your settings are working reasonably well. Fine-tuning some options might improve your experience.");
    
    if (!profile.cognitive.showProgressIndicator) {
      recommendations.push("Enabling progress indicators can help you track your learning journey.");
    }
  } else {
    recommendations.push("Your current settings are working great! Keep up the good work.");
  }

  return recommendations;
}

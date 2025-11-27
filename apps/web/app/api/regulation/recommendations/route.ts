/**
 * Regulation Recommendations API Route
 * AI-powered activity suggestions based on learner patterns
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getRegulationStats,
  getRecentEmotions,
} from "@aivo/persistence";

// Define activity types locally since we don't need the full contracts
interface RegulationActivity {
  id: string;
  name: string;
  type: "BREATHING" | "MOVEMENT" | "GROUNDING" | "SENSORY";
  description: string;
  durationSeconds: number;
  difficulty?: "easy" | "medium" | "hard";
  instructions?: string[];
}

interface ActivityRecommendation {
  activity: RegulationActivity;
  reason: string;
  priority: number;
}

// Predefined activities
const BREATHING_ACTIVITIES: RegulationActivity[] = [
  { id: "breathing_478", name: "4-7-8 Breathing", type: "BREATHING", description: "Calm your mind with this relaxing pattern", durationSeconds: 120 },
  { id: "breathing_box", name: "Box Breathing", type: "BREATHING", description: "Square breathing for focus and calm", durationSeconds: 120 },
  { id: "breathing_bubble", name: "Bubble Breathing", type: "BREATHING", description: "Imagine blowing gentle bubbles", durationSeconds: 90 },
];

const MOVEMENT_ACTIVITIES: RegulationActivity[] = [
  { id: "movement_stretch", name: "Stretch Break", type: "MOVEMENT", description: "Gentle stretches to release tension", durationSeconds: 180 },
  { id: "movement_dance", name: "Dance Break", type: "MOVEMENT", description: "Move your body and boost your mood", durationSeconds: 120 },
  { id: "movement_yoga", name: "Yoga Moment", type: "MOVEMENT", description: "Simple yoga poses for balance", durationSeconds: 180 },
];

const GROUNDING_ACTIVITIES: RegulationActivity[] = [
  { id: "grounding_54321", name: "5-4-3-2-1 Grounding", type: "GROUNDING", description: "Connect with your senses", durationSeconds: 180 },
  { id: "grounding_bodyscan", name: "Body Scan", type: "GROUNDING", description: "Notice how your body feels", durationSeconds: 240 },
];

const SENSORY_ACTIVITIES: RegulationActivity[] = [
  { id: "sensory_music", name: "Calming Sounds", type: "SENSORY", description: "Listen to peaceful sounds", durationSeconds: 180 },
  { id: "sensory_visual", name: "Visual Calm", type: "SENSORY", description: "Watch soothing visual patterns", durationSeconds: 120 },
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const learnerId = session.user.id;

    // Gather learner data for personalized recommendations
    const [stats, recentEmotions] = await Promise.all([
      getRegulationStats(learnerId),
      getRecentEmotions(learnerId, 10),
    ]);

    // Calculate current state indicators
    const currentEmotionLevel = recentEmotions.length > 0 
      ? recentEmotions[0].level 
      : 3;
    
    // Check for recent high distress (level 4-5 with negative emotions)
    const hasRecentDistress = recentEmotions.some(
      e => e.level >= 4 && ["angry", "anxious", "frustrated", "overwhelmed", "sad"].includes(e.emotion)
    );

    // Build personalized recommendations
    const recommendations: ActivityRecommendation[] = [];

    // Priority 1: If in high distress, recommend calming activities
    if (hasRecentDistress || currentEmotionLevel >= 4) {
      recommendations.push({
        activity: BREATHING_ACTIVITIES[0],
        reason: "Breathing exercises help calm your nervous system quickly",
        priority: 1,
      });
      recommendations.push({
        activity: GROUNDING_ACTIVITIES[0],
        reason: "Grounding exercises help you feel more present and safe",
        priority: 2,
      });
      recommendations.push({
        activity: SENSORY_ACTIVITIES[0],
        reason: "Calming sounds can help reduce stress",
        priority: 3,
      });
    } 
    // Priority 2: Moderate state - mix of activities
    else if (currentEmotionLevel === 3) {
      recommendations.push({
        activity: MOVEMENT_ACTIVITIES[0],
        reason: "Movement helps release tension and boost your mood",
        priority: 1,
      });
      recommendations.push({
        activity: BREATHING_ACTIVITIES[1],
        reason: "Box breathing helps maintain calm focus",
        priority: 2,
      });
      recommendations.push({
        activity: GROUNDING_ACTIVITIES[1],
        reason: "A body scan helps you check in with how you're feeling",
        priority: 3,
      });
    }
    // Priority 3: Good state - maintenance and growth activities
    else {
      recommendations.push({
        activity: MOVEMENT_ACTIVITIES[1],
        reason: "Keep your positive energy flowing with some movement!",
        priority: 1,
      });
      recommendations.push({
        activity: SENSORY_ACTIVITIES[1],
        reason: "Enjoy some peaceful visuals to maintain your calm state",
        priority: 2,
      });
      recommendations.push({
        activity: BREATHING_ACTIVITIES[2],
        reason: "Fun breathing exercises help build good habits",
        priority: 3,
      });
    }

    // Add activity effectiveness based on past data
    if (stats.mostEffectiveActivity) {
      const activityLists: Record<string, RegulationActivity[]> = {
        BREATHING: BREATHING_ACTIVITIES,
        MOVEMENT: MOVEMENT_ACTIVITIES,
        GROUNDING: GROUNDING_ACTIVITIES,
        SENSORY: SENSORY_ACTIVITIES,
      };

      const effectiveType = stats.mostEffectiveActivity;
      const activityList = activityLists[effectiveType];

      if (activityList && activityList.length > 0) {
        const alreadyRecommended = recommendations.some(
          (r) => r.activity.type === effectiveType
        );

        if (!alreadyRecommended) {
          recommendations.push({
            activity: activityList[0],
            reason: "This type of activity has worked well for you in the past",
            priority: recommendations.length + 1,
          });
        }
      }
    }

    return NextResponse.json({
      recommendations: recommendations.slice(0, 4),
      currentEmotionLevel,
      stats: {
        totalSessions: stats.totalSessions,
        completedSessions: stats.completedSessions,
        avgMoodImprovement: stats.emotionImprovementRate,
        mostEffectiveActivity: stats.mostEffectiveActivity ?? undefined,
        activityBreakdown: stats.activityBreakdown,
      },
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

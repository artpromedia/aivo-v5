/**
 * Sensory Questionnaire API Route
 * Handles sensory questionnaire responses and generates profile recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { upsertSensoryProfile } from "@aivo/persistence";
import {
  SENSORY_QUESTIONNAIRE,
  SENSORY_PRESETS,
  DEFAULT_VISUAL_SETTINGS,
  DEFAULT_AUDITORY_SETTINGS,
  DEFAULT_MOTOR_SETTINGS,
  DEFAULT_COGNITIVE_SETTINGS,
  DEFAULT_ENVIRONMENT_SETTINGS,
  type PresetId,
  type VisualSettings,
  type AuditorySettings,
  type MotorSettings,
  type CognitiveSettings,
  type EnvironmentSettings,
} from "@aivo/api-client/src/sensory-contracts";

interface QuestionnaireSubmission {
  learnerId: string;
  answers: Record<string, unknown>;
  applyImmediately?: boolean;
}

interface SuggestedSettings {
  visual: Partial<VisualSettings>;
  auditory: Partial<AuditorySettings>;
  motor: Partial<MotorSettings>;
  cognitive: Partial<CognitiveSettings>;
  environment: Partial<EnvironmentSettings>;
}

/**
 * GET /api/sensory/questionnaire
 * Get the sensory questionnaire questions
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      questions: SENSORY_QUESTIONNAIRE,
      categories: ["visual", "auditory", "motor", "cognitive", "environment", "triggers"],
    });
  } catch (error) {
    console.error("Error fetching questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to fetch questionnaire" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sensory/questionnaire
 * Submit questionnaire answers and get profile recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as QuestionnaireSubmission;

    if (!body.learnerId || !body.answers) {
      return NextResponse.json(
        { error: "Missing required fields: learnerId and answers" },
        { status: 400 }
      );
    }

    // Process answers into suggested settings
    const suggestedSettings = processAnswers(body.answers);

    // Find best matching preset
    const { suggestedPreset, confidence } = findBestPreset(suggestedSettings);

    // Apply immediately if requested
    let profile = null;
    if (body.applyImmediately) {
      const mergedSettings = {
        visual: { ...DEFAULT_VISUAL_SETTINGS, ...suggestedSettings.visual },
        auditory: { ...DEFAULT_AUDITORY_SETTINGS, ...suggestedSettings.auditory },
        motor: { ...DEFAULT_MOTOR_SETTINGS, ...suggestedSettings.motor },
        cognitive: { ...DEFAULT_COGNITIVE_SETTINGS, ...suggestedSettings.cognitive },
        environment: { ...DEFAULT_ENVIRONMENT_SETTINGS, ...suggestedSettings.environment },
        presetId: suggestedPreset,
      };

      profile = await upsertSensoryProfile(body.learnerId, mergedSettings);
    }

    return NextResponse.json({
      suggestedPreset,
      suggestedSettings,
      confidence,
      presetDetails: suggestedPreset
        ? SENSORY_PRESETS.find((p) => p.id === suggestedPreset)
        : null,
      profile,
    });
  } catch (error) {
    console.error("Error processing questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to process questionnaire" },
      { status: 500 }
    );
  }
}

/**
 * Process questionnaire answers into suggested settings
 */
function processAnswers(answers: Record<string, unknown>): SuggestedSettings {
  const settings: SuggestedSettings = {
    visual: {},
    auditory: {},
    motor: {},
    cognitive: {},
    environment: {},
  };

  for (const question of SENSORY_QUESTIONNAIRE) {
    const answer = answers[question.id];
    if (answer === undefined || answer === null) continue;

    // Parse setting key (e.g., "visual.reduceAnimations")
    const [category, key] = question.settingKey.split(".") as [
      keyof SuggestedSettings,
      string
    ];

    if (question.type === "boolean" && answer === true) {
      // For boolean questions, apply the predefined settingValue
      if (settings[category]) {
        (settings[category] as Record<string, unknown>)[key] = question.settingValue;
      }
    } else if (question.type === "select" && typeof answer === "string") {
      // For select questions, use the selected value directly
      if (settings[category]) {
        (settings[category] as Record<string, unknown>)[key] = answer;
      }
    } else if (question.type === "scale" && typeof answer === "number") {
      // For scale questions, map to appropriate value
      if (settings[category]) {
        (settings[category] as Record<string, unknown>)[key] = answer;
      }
    }
  }

  return settings;
}

/**
 * Find the best matching preset based on suggested settings
 */
function findBestPreset(settings: SuggestedSettings): {
  suggestedPreset: PresetId | null;
  confidence: number;
} {
  let bestMatch: PresetId | null = null;
  let bestScore = 0;
  let maxPossibleScore = 0;

  for (const preset of SENSORY_PRESETS) {
    let matchScore = 0;
    let possibleScore = 0;

    // Compare each category
    for (const category of ["visual", "auditory", "motor", "cognitive", "environment"] as const) {
      const presetSettings = preset.settings[category];
      const userSettings = settings[category];

      if (!presetSettings) continue;

      for (const [key, presetValue] of Object.entries(presetSettings)) {
        possibleScore++;
        const userValue = (userSettings as Record<string, unknown>)?.[key];
        
        if (userValue !== undefined && userValue === presetValue) {
          matchScore++;
        }
      }
    }

    if (possibleScore > maxPossibleScore) {
      maxPossibleScore = possibleScore;
    }

    if (matchScore > bestScore) {
      bestScore = matchScore;
      bestMatch = preset.id;
    }
  }

  // Calculate confidence (0-1)
  const confidence = maxPossibleScore > 0 ? bestScore / maxPossibleScore : 0;

  // Only suggest preset if confidence is above threshold
  return {
    suggestedPreset: confidence >= 0.3 ? bestMatch : null,
    confidence: Math.round(confidence * 100) / 100,
  };
}

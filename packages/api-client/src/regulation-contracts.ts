/**
 * Self-Regulation Hub API Contracts
 * 
 * Defines request/response types for the self-regulation and emotional wellness feature.
 */

// Enums matching Prisma schema

export type RegulationActivityType = 
  | "BREATHING" 
  | "MOVEMENT" 
  | "GROUNDING" 
  | "SENSORY";

export type EmotionType = 
  | "happy"
  | "calm"
  | "excited"
  | "focused"
  | "tired"
  | "sad"
  | "anxious"
  | "frustrated"
  | "angry"
  | "overwhelmed";

export type GradeBand = "K5" | "MS" | "HS";

// Core types

export interface RegulationSession {
  id: string;
  learnerId: string;
  activityId: string;
  activityType: RegulationActivityType;
  emotionBefore: string | null;
  emotionLevelBefore: number | null;
  emotionAfter: string | null;
  emotionLevelAfter: number | null;
  durationSeconds: number;
  completed: boolean;
  effectiveness: number | null;
  notes: string | null;
  triggeredBy: string | null;
  context: Record<string, unknown> | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmotionRecord {
  id: string;
  learnerId: string;
  emotion: EmotionType;
  level: number; // 1-5
  trigger: string | null;
  strategy: string | null;
  context: Record<string, unknown> | null;
  source: string;
  notifyParent: boolean;
  timestamp: string;
  createdAt: string;
}

// Activity definitions

export interface BreathingActivity {
  id: string;
  name: string;
  description: string;
  type: "BREATHING";
  pattern: {
    inhale: number;   // seconds
    hold?: number;    // seconds (optional)
    exhale: number;   // seconds
    holdAfter?: number; // seconds (optional)
  };
  cycles: number;
  totalDuration: number; // seconds
  difficulty: "easy" | "medium" | "advanced";
  gradeBands: GradeBand[];
  audioUrl?: string;
  animationType: "circle" | "wave" | "balloon" | "flower";
  calmingColor: string;
  instructions: string[];
}

export interface MovementActivity {
  id: string;
  name: string;
  description: string;
  type: "MOVEMENT";
  movements: {
    name: string;
    duration: number;
    instruction: string;
    imageUrl?: string;
    videoUrl?: string;
  }[];
  totalDuration: number;
  intensity: "low" | "medium" | "high";
  gradeBands: GradeBand[];
  musicUrl?: string;
  requiresSpace: boolean;
}

export interface GroundingActivity {
  id: string;
  name: string;
  description: string;
  type: "GROUNDING";
  technique: "54321" | "body_scan" | "safe_place" | "rainbow";
  steps: {
    sense?: string;  // For 54321: "see", "touch", "hear", "smell", "taste"
    count: number;
    prompt: string;
    duration: number;
  }[];
  totalDuration: number;
  gradeBands: GradeBand[];
  audioUrl?: string;
  backgroundUrl?: string;
}

export interface SensoryActivity {
  id: string;
  name: string;
  description: string;
  type: "SENSORY";
  sensoryType: "visual" | "auditory" | "tactile" | "fidget";
  contentUrl?: string;
  duration: number | null; // null = user-controlled
  isInteractive: boolean;
  gradeBands: GradeBand[];
  options?: {
    soundscapes?: string[];
    visualThemes?: string[];
    fidgetTypes?: string[];
  };
}

export type RegulationActivity = 
  | BreathingActivity 
  | MovementActivity 
  | GroundingActivity 
  | SensoryActivity;

// Emotion check-in types

export interface EmotionOption {
  id: EmotionType;
  label: string;
  emoji: string;
  color: string;
  description: string;
  gradeBandLabels?: Record<GradeBand, string>;
}

export interface EmotionCheckInData {
  emotion: EmotionType;
  level: number; // 1-5
  trigger?: string;
  context?: Record<string, unknown>;
}

// Request/Response types

export interface CreateRegulationSessionRequest {
  learnerId: string;
  activityId: string;
  activityType: RegulationActivityType;
  emotionBefore?: string;
  emotionLevelBefore?: number;
  triggeredBy?: string;
  context?: Record<string, unknown>;
}

export interface CreateRegulationSessionResponse {
  session: RegulationSession;
  activity: RegulationActivity;
}

export interface UpdateRegulationSessionRequest {
  emotionAfter?: string;
  emotionLevelAfter?: number;
  durationSeconds?: number;
  completed?: boolean;
  effectiveness?: number;
  notes?: string;
}

export interface UpdateRegulationSessionResponse {
  session: RegulationSession;
}

export interface ListRegulationSessionsRequest {
  learnerId: string;
  activityType?: RegulationActivityType;
  completed?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface ListRegulationSessionsResponse {
  sessions: RegulationSession[];
  total: number;
}

export interface LogEmotionRequest {
  learnerId: string;
  emotion: EmotionType;
  level: number;
  trigger?: string;
  strategy?: string;
  context?: Record<string, unknown>;
  source?: string;
}

export interface LogEmotionResponse {
  record: EmotionRecord;
  notifyParent: boolean;
  suggestedActivity?: RegulationActivity;
}

export interface GetEmotionHistoryRequest {
  learnerId: string;
  emotion?: EmotionType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface GetEmotionHistoryResponse {
  records: EmotionRecord[];
  total: number;
  summary: EmotionSummary;
}

export interface EmotionSummary {
  mostFrequentEmotion: EmotionType | null;
  averageLevel: number;
  emotionCounts: Record<EmotionType, number>;
  trendDirection: "improving" | "stable" | "declining" | "insufficient_data";
  commonTriggers: string[];
  effectiveStrategies: string[];
}

export interface GetRecommendationsRequest {
  learnerId: string;
  currentEmotion?: EmotionType;
  currentLevel?: number;
  context?: {
    timeOfDay?: string;
    currentSubject?: string;
    recentActivity?: string;
  };
}

export interface GetRecommendationsResponse {
  recommendations: RecommendedActivity[];
  reasoning: string;
}

export interface RecommendedActivity {
  activity: RegulationActivity;
  score: number; // 0-1 relevance score
  reason: string;
}

// Stats and analytics

export interface RegulationStats {
  totalSessions: number;
  completedSessions: number;
  averageEffectiveness: number;
  totalMinutes: number;
  activityBreakdown: Record<RegulationActivityType, number>;
  mostEffectiveActivity: RegulationActivityType | null;
  emotionImprovementRate: number; // % of sessions where emotion improved
  streakDays: number; // consecutive days with regulation activities
}

export interface GetRegulationStatsRequest {
  learnerId: string;
  startDate?: string;
  endDate?: string;
}

export interface GetRegulationStatsResponse {
  stats: RegulationStats;
  recentSessions: RegulationSession[];
}

// Activity library

export interface GetActivityLibraryRequest {
  gradeBand?: GradeBand;
  activityType?: RegulationActivityType;
  difficulty?: "easy" | "medium" | "advanced";
  maxDuration?: number;
}

export interface GetActivityLibraryResponse {
  activities: RegulationActivity[];
  categories: {
    type: RegulationActivityType;
    label: string;
    description: string;
    icon: string;
    count: number;
  }[];
}

// Error types

export interface RegulationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type RegulationErrorCode = 
  | "SESSION_NOT_FOUND"
  | "INVALID_EMOTION"
  | "INVALID_ACTIVITY"
  | "SESSION_ALREADY_COMPLETE"
  | "LEARNER_NOT_FOUND";

// =============================================
// Activity Library Constants
// =============================================

export const BREATHING_ACTIVITIES: RegulationActivity[] = [
  {
    id: "breathing_478",
    name: "4-7-8 Breathing",
    description: "A calming pattern: breathe in for 4 seconds, hold for 7, breathe out for 8",
    type: "BREATHING",
    pattern: { inhale: 4, hold: 7, exhale: 8 },
    cycles: 4,
    totalDuration: 76, // (4+7+8) * 4
    difficulty: "medium",
    gradeBands: ["MS", "HS"],
    animationType: "circle",
    calmingColor: "#E6E6FA", // lavender
    instructions: [
      "Get comfortable and close your eyes if you like",
      "Breathe in slowly through your nose for 4 seconds",
      "Hold your breath gently for 7 seconds",
      "Breathe out slowly through your mouth for 8 seconds",
      "Repeat 4 times"
    ]
  } as BreathingActivity,
  {
    id: "breathing_box",
    name: "Box Breathing",
    description: "Equal timing breathing to calm and focus: in, hold, out, hold",
    type: "BREATHING",
    pattern: { inhale: 4, hold: 4, exhale: 4, holdAfter: 4 },
    cycles: 4,
    totalDuration: 64, // (4+4+4+4) * 4
    difficulty: "easy",
    gradeBands: ["K5", "MS", "HS"],
    animationType: "wave",
    calmingColor: "#87CEEB", // sky blue
    instructions: [
      "Imagine drawing a box in the air",
      "Breathe in while drawing the first side (4 seconds)",
      "Hold your breath while drawing the second side (4 seconds)",
      "Breathe out while drawing the third side (4 seconds)",
      "Hold while drawing the last side (4 seconds)"
    ]
  } as BreathingActivity,
  {
    id: "breathing_bubble",
    name: "Bubble Breathing",
    description: "Imagine blowing big, gentle bubbles to float away",
    type: "BREATHING",
    pattern: { inhale: 3, hold: 1, exhale: 5 },
    cycles: 5,
    totalDuration: 45, // (3+1+5) * 5
    difficulty: "easy",
    gradeBands: ["K5", "MS"],
    animationType: "balloon",
    calmingColor: "#98FB98", // mint green
    instructions: [
      "Imagine you have a magic bubble wand",
      "Take a slow breath in through your nose",
      "Hold it for just a moment",
      "Blow out slowly like making a big bubble",
      "Watch your imaginary bubble float away!"
    ]
  } as BreathingActivity,
];

export const MOVEMENT_ACTIVITIES: RegulationActivity[] = [
  {
    id: "movement_stretch",
    name: "Stretch Break",
    description: "Gentle stretches to release tension and feel better",
    type: "MOVEMENT",
    movements: [
      { name: "Reach for the Sky", duration: 15, instruction: "Stretch your arms up high like you're touching the clouds" },
      { name: "Shoulder Rolls", duration: 15, instruction: "Roll your shoulders in circles - forward then backward" },
      { name: "Side Stretch", duration: 20, instruction: "Reach one arm over your head and lean to the side" },
      { name: "Forward Fold", duration: 15, instruction: "Slowly bend forward and let your arms hang loose" },
      { name: "Neck Circles", duration: 15, instruction: "Gently roll your head in a circle" }
    ],
    totalDuration: 80,
    intensity: "low",
    gradeBands: ["K5", "MS", "HS"],
    requiresSpace: false
  } as MovementActivity,
  {
    id: "movement_dance",
    name: "Dance Break",
    description: "Shake out your energy with some fun moves!",
    type: "MOVEMENT",
    movements: [
      { name: "Shake It Out", duration: 20, instruction: "Shake your hands, then your arms, then your whole body!" },
      { name: "March in Place", duration: 20, instruction: "March like you're in a parade - lift those knees!" },
      { name: "Side Steps", duration: 20, instruction: "Step side to side and add some arm swings" },
      { name: "Twist", duration: 20, instruction: "Twist your body left and right - move those hips!" },
      { name: "Cool Down Sway", duration: 20, instruction: "Slow down and sway gently from side to side" }
    ],
    totalDuration: 100,
    intensity: "medium",
    gradeBands: ["K5", "MS"],
    requiresSpace: true
  } as MovementActivity,
  {
    id: "movement_yoga",
    name: "Mini Yoga Flow",
    description: "Simple yoga poses to find balance and calm",
    type: "MOVEMENT",
    movements: [
      { name: "Mountain Pose", duration: 20, instruction: "Stand tall with feet together, arms at your sides" },
      { name: "Tree Pose", duration: 30, instruction: "Balance on one foot, other foot on your calf or thigh" },
      { name: "Cat-Cow Stretch", duration: 30, instruction: "On hands and knees, arch and round your back" },
      { name: "Child's Pose", duration: 30, instruction: "Sit back on your heels, reach arms forward on the floor" },
      { name: "Standing Forward Bend", duration: 20, instruction: "Fold forward from your hips, let your head hang" }
    ],
    totalDuration: 130,
    intensity: "low",
    gradeBands: ["MS", "HS"],
    requiresSpace: true
  } as MovementActivity,
];

export const GROUNDING_ACTIVITIES: RegulationActivity[] = [
  {
    id: "grounding_54321",
    name: "5-4-3-2-1 Grounding",
    description: "Use your senses to feel calm and present",
    type: "GROUNDING",
    technique: "54321",
    steps: [
      { sense: "see", count: 5, prompt: "Name 5 things you can see around you", duration: 30 },
      { sense: "touch", count: 4, prompt: "Name 4 things you can feel or touch", duration: 25 },
      { sense: "hear", count: 3, prompt: "Name 3 things you can hear right now", duration: 20 },
      { sense: "smell", count: 2, prompt: "Name 2 things you can smell", duration: 15 },
      { sense: "taste", count: 1, prompt: "Name 1 thing you can taste", duration: 10 }
    ],
    totalDuration: 100,
    gradeBands: ["K5", "MS", "HS"]
  } as GroundingActivity,
  {
    id: "grounding_bodyscan",
    name: "Body Scan",
    description: "Notice how each part of your body feels",
    type: "GROUNDING",
    technique: "body_scan",
    steps: [
      { count: 1, prompt: "Notice your feet - are they warm? Cool? Relaxed?", duration: 20 },
      { count: 1, prompt: "Move to your legs - any tension? Just notice it", duration: 20 },
      { count: 1, prompt: "Check your belly - is it tight or soft?", duration: 20 },
      { count: 1, prompt: "Notice your hands and arms - let them feel heavy", duration: 20 },
      { count: 1, prompt: "Feel your shoulders - let them drop down", duration: 20 },
      { count: 1, prompt: "Notice your face - relax your jaw and forehead", duration: 20 }
    ],
    totalDuration: 120,
    gradeBands: ["MS", "HS"]
  } as GroundingActivity,
  {
    id: "grounding_safeplace",
    name: "Safe Place Visualization",
    description: "Imagine your favorite calm and safe place",
    type: "GROUNDING",
    technique: "safe_place",
    steps: [
      { count: 1, prompt: "Close your eyes and take a deep breath", duration: 15 },
      { count: 1, prompt: "Picture your favorite safe, calm place", duration: 20 },
      { count: 1, prompt: "What do you see there? Notice the colors and shapes", duration: 25 },
      { count: 1, prompt: "What sounds are there? Maybe birds, water, or quiet?", duration: 25 },
      { count: 1, prompt: "How does it feel to be there? Warm? Cozy? Peaceful?", duration: 25 },
      { count: 1, prompt: "Take one more deep breath and bring that calm feeling with you", duration: 15 }
    ],
    totalDuration: 125,
    gradeBands: ["K5", "MS", "HS"]
  } as GroundingActivity,
];

export const SENSORY_ACTIVITIES: RegulationActivity[] = [
  {
    id: "sensory_nature_sounds",
    name: "Nature Sounds",
    description: "Listen to calming sounds from nature",
    type: "SENSORY",
    sensoryType: "auditory",
    duration: 180, // 3 minutes
    isInteractive: false,
    gradeBands: ["K5", "MS", "HS"],
    options: {
      soundscapes: ["rain", "ocean_waves", "forest_birds", "gentle_stream"]
    }
  } as SensoryActivity,
  {
    id: "sensory_visual_calm",
    name: "Visual Calm",
    description: "Watch soothing colors and patterns",
    type: "SENSORY",
    sensoryType: "visual",
    duration: 120, // 2 minutes
    isInteractive: false,
    gradeBands: ["K5", "MS", "HS"],
    options: {
      visualThemes: ["flowing_water", "clouds", "northern_lights", "gentle_waves"]
    }
  } as SensoryActivity,
  {
    id: "sensory_fidget",
    name: "Virtual Fidget",
    description: "Interactive calming fidget activities",
    type: "SENSORY",
    sensoryType: "fidget",
    duration: null, // user-controlled
    isInteractive: true,
    gradeBands: ["K5", "MS", "HS"],
    options: {
      fidgetTypes: ["pop_bubbles", "sand_draw", "slime_stretch", "spinner"]
    }
  } as SensoryActivity,
];

// Combine all activities for easy access
export const ALL_ACTIVITIES: RegulationActivity[] = [
  ...BREATHING_ACTIVITIES,
  ...MOVEMENT_ACTIVITIES,
  ...GROUNDING_ACTIVITIES,
  ...SENSORY_ACTIVITIES,
];

// Helper to get activity by ID
export function getActivityById(id: string): RegulationActivity | undefined {
  return ALL_ACTIVITIES.find(a => a.id === id);
}

// Helper to get activities by type
export function getActivitiesByType(type: RegulationActivityType): RegulationActivity[] {
  return ALL_ACTIVITIES.filter(a => a.type === type);
}

// Activity recommendation type for API responses
export interface ActivityRecommendation {
  activity: RegulationActivity;
  reason: string;
  priority: number;
}

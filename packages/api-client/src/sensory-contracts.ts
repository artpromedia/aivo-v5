/**
 * Sensory Profile API Contracts
 * 
 * Types for managing accessibility accommodations for neurodiverse learners.
 */

// =============================================================================
// Visual Settings
// =============================================================================

export type FontSize = "small" | "medium" | "large" | "x-large";
export type FontFamily = "default" | "dyslexic" | "sans-serif" | "serif";
export type LineSpacing = "normal" | "relaxed" | "loose";
export type ColorScheme = "default" | "warm" | "cool" | "muted" | "high-contrast";
export type FlashingContent = "allow" | "warn" | "block";

export interface VisualSettings {
  reduceAnimations: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  darkMode: boolean;
  reducedClutter: boolean;
  fontSize: FontSize;
  fontFamily: FontFamily;
  lineSpacing: LineSpacing;
  colorScheme: ColorScheme;
  flashingContent: FlashingContent;
}

export const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
  reduceAnimations: false,
  reduceMotion: false,
  highContrast: false,
  darkMode: false,
  reducedClutter: false,
  fontSize: "medium",
  fontFamily: "default",
  lineSpacing: "normal",
  colorScheme: "default",
  flashingContent: "allow",
};

// =============================================================================
// Auditory Settings
// =============================================================================

export interface AuditorySettings {
  muteAllSounds: boolean;
  soundVolume: number; // 0-100
  noBackgroundMusic: boolean;
  noSoundEffects: boolean;
  textToSpeechEnabled: boolean;
  textToSpeechSpeed: number; // 0.5-2.0
  textToSpeechVoice: string;
  audioDescriptions: boolean;
}

export const DEFAULT_AUDITORY_SETTINGS: AuditorySettings = {
  muteAllSounds: false,
  soundVolume: 70,
  noBackgroundMusic: false,
  noSoundEffects: false,
  textToSpeechEnabled: false,
  textToSpeechSpeed: 1.0,
  textToSpeechVoice: "default",
  audioDescriptions: false,
};

// =============================================================================
// Motor Settings
// =============================================================================

export interface MotorSettings {
  largerClickTargets: boolean;
  noDoubleClick: boolean;
  noDragAndDrop: boolean;
  increaseSpacing: boolean;
  stickyKeys: boolean;
  keyboardOnly: boolean;
  touchAccommodations: boolean;
  hoverDelay: number; // milliseconds
}

export const DEFAULT_MOTOR_SETTINGS: MotorSettings = {
  largerClickTargets: false,
  noDoubleClick: false,
  noDragAndDrop: false,
  increaseSpacing: false,
  stickyKeys: false,
  keyboardOnly: false,
  touchAccommodations: false,
  hoverDelay: 0,
};

// =============================================================================
// Cognitive Settings
// =============================================================================

export interface CognitiveSettings {
  oneThingAtATime: boolean;
  noPopups: boolean;
  noAutoplay: boolean;
  simplifyInstructions: boolean;
  showProgressIndicator: boolean;
  limitChoices: number | null; // null = no limit
  extendedTime: boolean;
  timeMultiplier: number; // 1.0-3.0
  breakReminders: boolean;
  breakFrequency: number; // minutes
}

export const DEFAULT_COGNITIVE_SETTINGS: CognitiveSettings = {
  oneThingAtATime: false,
  noPopups: false,
  noAutoplay: false,
  simplifyInstructions: false,
  showProgressIndicator: true,
  limitChoices: null,
  extendedTime: false,
  timeMultiplier: 1.0,
  breakReminders: false,
  breakFrequency: 30,
};

// =============================================================================
// Environment Settings
// =============================================================================

export type WhiteNoiseType = "none" | "rain" | "ocean" | "forest" | "pink" | "brown";

export interface EnvironmentSettings {
  fullScreenMode: boolean;
  minimizeDistractions: boolean;
  hideChat: boolean;
  hideNotifications: boolean;
  whiteNoise: WhiteNoiseType;
}

export const DEFAULT_ENVIRONMENT_SETTINGS: EnvironmentSettings = {
  fullScreenMode: false,
  minimizeDistractions: false,
  hideChat: false,
  hideNotifications: false,
  whiteNoise: "none",
};

// =============================================================================
// Trigger Settings
// =============================================================================

export type PatternType = "stripes" | "polka-dots" | "checkers" | "spirals" | "zigzag";
export type ContentWarning = "loud" | "sudden" | "crowded" | "flashing" | "intense-emotion";

export interface TriggerSettings {
  avoidColors: string[]; // hex colors to avoid
  avoidPatterns: PatternType[];
  avoidFlashing: boolean;
  contentWarnings: ContentWarning[];
}

export const DEFAULT_TRIGGER_SETTINGS: TriggerSettings = {
  avoidColors: [],
  avoidPatterns: [],
  avoidFlashing: false,
  contentWarnings: [],
};

// =============================================================================
// Complete Sensory Profile
// =============================================================================

export interface SensoryProfile {
  id: string;
  learnerId: string;
  name: string | null;
  presetId: string | null;
  isActive: boolean;
  visual: VisualSettings;
  auditory: AuditorySettings;
  motor: MotorSettings;
  cognitive: CognitiveSettings;
  environment: EnvironmentSettings;
  triggers: TriggerSettings | null;
  lastEffectivenessCheck: string | null;
  effectivenessScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_SENSORY_PROFILE: Omit<SensoryProfile, "id" | "learnerId" | "createdAt" | "updatedAt"> = {
  name: null,
  presetId: null,
  isActive: true,
  visual: DEFAULT_VISUAL_SETTINGS,
  auditory: DEFAULT_AUDITORY_SETTINGS,
  motor: DEFAULT_MOTOR_SETTINGS,
  cognitive: DEFAULT_COGNITIVE_SETTINGS,
  environment: DEFAULT_ENVIRONMENT_SETTINGS,
  triggers: null,
  lastEffectivenessCheck: null,
  effectivenessScore: null,
};

// =============================================================================
// Preset Profiles
// =============================================================================

export type PresetId =
  | "asd-low-sensory"
  | "adhd-focus"
  | "dyslexia-friendly"
  | "visual-impairment"
  | "motor-difficulties"
  | "anxiety-friendly"
  | "custom";

export interface SensoryPreset {
  id: PresetId;
  name: string;
  description: string;
  icon: string;
  category: "neurodiversity" | "sensory" | "motor" | "cognitive";
  tags: string[];
  settings: Partial<{
    visual: Partial<VisualSettings>;
    auditory: Partial<AuditorySettings>;
    motor: Partial<MotorSettings>;
    cognitive: Partial<CognitiveSettings>;
    environment: Partial<EnvironmentSettings>;
    triggers: Partial<TriggerSettings>;
  }>;
}

export const SENSORY_PRESETS: SensoryPreset[] = [
  {
    id: "asd-low-sensory",
    name: "Low Sensory (ASD)",
    description: "Reduced sensory input for autism spectrum learners who prefer calm environments",
    icon: "🌙",
    category: "neurodiversity",
    tags: ["autism", "sensory", "calm"],
    settings: {
      visual: {
        reduceAnimations: true,
        reduceMotion: true,
        reducedClutter: true,
        colorScheme: "muted",
        flashingContent: "block",
      },
      auditory: {
        noBackgroundMusic: true,
        noSoundEffects: true,
        soundVolume: 50,
      },
      cognitive: {
        oneThingAtATime: true,
        noPopups: true,
        noAutoplay: true,
        limitChoices: 3,
      },
      environment: {
        minimizeDistractions: true,
        hideNotifications: true,
      },
      triggers: {
        avoidFlashing: true,
        contentWarnings: ["loud", "sudden", "crowded"],
      },
    },
  },
  {
    id: "adhd-focus",
    name: "Focus Mode (ADHD)",
    description: "Minimize distractions and provide frequent breaks for ADHD learners",
    icon: "🎯",
    category: "neurodiversity",
    tags: ["adhd", "focus", "breaks"],
    settings: {
      visual: {
        reducedClutter: true,
        reduceAnimations: true,
      },
      cognitive: {
        oneThingAtATime: true,
        noPopups: true,
        noAutoplay: true,
        showProgressIndicator: true,
        breakReminders: true,
        breakFrequency: 15,
      },
      environment: {
        minimizeDistractions: true,
        hideChat: true,
        hideNotifications: true,
      },
    },
  },
  {
    id: "dyslexia-friendly",
    name: "Dyslexia Friendly",
    description: "Optimized reading experience with dyslexic font and text-to-speech",
    icon: "📖",
    category: "cognitive",
    tags: ["dyslexia", "reading", "font"],
    settings: {
      visual: {
        fontFamily: "dyslexic",
        fontSize: "large",
        lineSpacing: "loose",
        colorScheme: "warm",
      },
      auditory: {
        textToSpeechEnabled: true,
        textToSpeechSpeed: 0.9,
      },
      cognitive: {
        simplifyInstructions: true,
        extendedTime: true,
        timeMultiplier: 1.5,
      },
    },
  },
  {
    id: "visual-impairment",
    name: "Visual Accessibility",
    description: "High contrast, large fonts, and audio support for visual impairments",
    icon: "👁️",
    category: "sensory",
    tags: ["visual", "contrast", "audio"],
    settings: {
      visual: {
        highContrast: true,
        fontSize: "x-large",
        lineSpacing: "relaxed",
        colorScheme: "high-contrast",
      },
      auditory: {
        textToSpeechEnabled: true,
        audioDescriptions: true,
      },
      motor: {
        largerClickTargets: true,
        increaseSpacing: true,
      },
    },
  },
  {
    id: "motor-difficulties",
    name: "Motor Accessibility",
    description: "Larger targets and keyboard navigation for motor difficulties",
    icon: "🎮",
    category: "motor",
    tags: ["motor", "keyboard", "accessibility"],
    settings: {
      motor: {
        largerClickTargets: true,
        noDoubleClick: true,
        noDragAndDrop: true,
        increaseSpacing: true,
        keyboardOnly: true,
        hoverDelay: 500,
      },
      cognitive: {
        extendedTime: true,
        timeMultiplier: 2.0,
      },
    },
  },
  {
    id: "anxiety-friendly",
    name: "Anxiety-Friendly",
    description: "Calm environment with predictable interactions for anxious learners",
    icon: "🌿",
    category: "neurodiversity",
    tags: ["anxiety", "calm", "predictable"],
    settings: {
      visual: {
        reduceAnimations: true,
        colorScheme: "cool",
        flashingContent: "block",
      },
      auditory: {
        noSoundEffects: true,
        soundVolume: 40,
      },
      cognitive: {
        noPopups: true,
        noAutoplay: true,
        showProgressIndicator: true,
        breakReminders: true,
        breakFrequency: 20,
      },
      environment: {
        minimizeDistractions: true,
        hideNotifications: true,
        whiteNoise: "rain",
      },
      triggers: {
        contentWarnings: ["sudden", "intense-emotion"],
      },
    },
  },
];

// =============================================================================
// Questionnaire Types
// =============================================================================

export interface QuestionnaireQuestion {
  id: string;
  category: "visual" | "auditory" | "motor" | "cognitive" | "environment" | "triggers";
  question: string;
  description?: string;
  type: "boolean" | "scale" | "select" | "multiselect";
  options?: { value: string; label: string }[];
  settingKey: string;
  settingValue: unknown; // The value to set if selected/true
  gradeBands?: ("K5" | "MS" | "HS")[]; // Which grade bands this applies to
}

export const SENSORY_QUESTIONNAIRE: QuestionnaireQuestion[] = [
  // Visual questions
  {
    id: "q-animations",
    category: "visual",
    question: "Do moving images or animations distract or bother you?",
    type: "boolean",
    settingKey: "visual.reduceAnimations",
    settingValue: true,
  },
  {
    id: "q-bright-colors",
    category: "visual",
    question: "Do bright colors make it hard to focus?",
    type: "boolean",
    settingKey: "visual.colorScheme",
    settingValue: "muted",
  },
  {
    id: "q-text-size",
    category: "visual",
    question: "What text size is most comfortable for you?",
    type: "select",
    options: [
      { value: "small", label: "Small" },
      { value: "medium", label: "Medium (default)" },
      { value: "large", label: "Large" },
      { value: "x-large", label: "Extra Large" },
    ],
    settingKey: "visual.fontSize",
    settingValue: null, // Set from selection
  },
  {
    id: "q-dark-mode",
    category: "visual",
    question: "Do you prefer a dark background?",
    type: "boolean",
    settingKey: "visual.darkMode",
    settingValue: true,
  },
  // Auditory questions
  {
    id: "q-sounds",
    category: "auditory",
    question: "Do sounds and noises distract you or make you uncomfortable?",
    type: "boolean",
    settingKey: "auditory.muteAllSounds",
    settingValue: true,
  },
  {
    id: "q-tts",
    category: "auditory",
    question: "Would you like the computer to read text aloud to you?",
    type: "boolean",
    settingKey: "auditory.textToSpeechEnabled",
    settingValue: true,
  },
  // Cognitive questions
  {
    id: "q-one-at-a-time",
    category: "cognitive",
    question: "Do you work better when you see one thing at a time?",
    type: "boolean",
    settingKey: "cognitive.oneThingAtATime",
    settingValue: true,
  },
  {
    id: "q-breaks",
    category: "cognitive",
    question: "Would you like reminders to take breaks?",
    type: "boolean",
    settingKey: "cognitive.breakReminders",
    settingValue: true,
  },
  {
    id: "q-extra-time",
    category: "cognitive",
    question: "Do you need extra time for activities?",
    type: "boolean",
    settingKey: "cognitive.extendedTime",
    settingValue: true,
  },
  // Motor questions
  {
    id: "q-big-buttons",
    category: "motor",
    question: "Would bigger buttons be easier to click?",
    type: "boolean",
    settingKey: "motor.largerClickTargets",
    settingValue: true,
  },
  {
    id: "q-keyboard",
    category: "motor",
    question: "Do you prefer using the keyboard instead of a mouse?",
    type: "boolean",
    settingKey: "motor.keyboardOnly",
    settingValue: true,
  },
  // Environment questions
  {
    id: "q-distractions",
    category: "environment",
    question: "Do you want a cleaner screen with fewer things to look at?",
    type: "boolean",
    settingKey: "environment.minimizeDistractions",
    settingValue: true,
  },
  {
    id: "q-white-noise",
    category: "environment",
    question: "Would background sounds help you focus?",
    type: "select",
    options: [
      { value: "none", label: "No background sounds" },
      { value: "rain", label: "Rain sounds" },
      { value: "ocean", label: "Ocean waves" },
      { value: "forest", label: "Forest sounds" },
      { value: "pink", label: "Pink noise" },
    ],
    settingKey: "environment.whiteNoise",
    settingValue: null, // Set from selection
  },
];

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface GetSensoryProfileRequest {
  learnerId: string;
}

export interface GetSensoryProfileResponse {
  profile: SensoryProfile | null;
  presets: SensoryPreset[];
}

export interface UpdateSensoryProfileRequest {
  name?: string;
  presetId?: string | null;
  isActive?: boolean;
  visual?: Partial<VisualSettings>;
  auditory?: Partial<AuditorySettings>;
  motor?: Partial<MotorSettings>;
  cognitive?: Partial<CognitiveSettings>;
  environment?: Partial<EnvironmentSettings>;
  triggers?: Partial<TriggerSettings> | null;
}

export interface UpdateSensoryProfileResponse {
  profile: SensoryProfile;
}

export interface ApplyPresetRequest {
  presetId: PresetId;
  customizations?: Partial<UpdateSensoryProfileRequest>;
}

export interface ApplyPresetResponse {
  profile: SensoryProfile;
  appliedPreset: SensoryPreset;
}

export interface GetEffectivenessRequest {
  learnerId: string;
  startDate?: string;
  endDate?: string;
}

export interface EffectivenessMetric {
  date: string;
  engagementScore: number;
  completionRate: number;
  averageSessionDuration: number;
  settingsAtTime: Partial<SensoryProfile>;
}

export interface GetEffectivenessResponse {
  metrics: EffectivenessMetric[];
  overallScore: number;
  recommendations: string[];
}

export interface QuestionnaireSubmission {
  answers: Record<string, unknown>;
}

export interface QuestionnaireResult {
  suggestedPreset: PresetId | null;
  suggestedSettings: Partial<SensoryProfile>;
  confidence: number;
}

// =============================================================================
// CSS Variable Mapping
// =============================================================================

export interface SensoryCSSVariables {
  // Font
  "--font-size-base": string;
  "--font-family": string;
  "--line-height": string;
  
  // Colors
  "--color-scheme": string;
  "--bg-primary": string;
  "--bg-secondary": string;
  "--text-primary": string;
  "--text-secondary": string;
  "--accent-color": string;
  
  // Spacing
  "--click-target-min": string;
  "--element-spacing": string;
  
  // Animation
  "--animation-duration": string;
  "--transition-duration": string;
  
  // Misc
  "--hover-delay": string;
}

export function sensoryProfileToCSSVariables(profile: SensoryProfile): SensoryCSSVariables {
  const { visual, motor, cognitive } = profile;
  
  // Font size mapping
  const fontSizeMap: Record<FontSize, string> = {
    small: "14px",
    medium: "16px",
    large: "18px",
    "x-large": "22px",
  };
  
  // Font family mapping
  const fontFamilyMap: Record<FontFamily, string> = {
    default: "system-ui, -apple-system, sans-serif",
    dyslexic: "OpenDyslexic, Comic Sans MS, sans-serif",
    "sans-serif": "Arial, Helvetica, sans-serif",
    serif: "Georgia, Times New Roman, serif",
  };
  
  // Line height mapping
  const lineHeightMap: Record<LineSpacing, string> = {
    normal: "1.5",
    relaxed: "1.75",
    loose: "2.0",
  };
  
  // Color schemes
  const colorSchemes: Record<ColorScheme, { bg: string; bgSec: string; text: string; textSec: string; accent: string }> = {
    default: { bg: "#ffffff", bgSec: "#f3f4f6", text: "#1f2937", textSec: "#6b7280", accent: "#6366f1" },
    warm: { bg: "#fffbeb", bgSec: "#fef3c7", text: "#78350f", textSec: "#a16207", accent: "#f59e0b" },
    cool: { bg: "#f0f9ff", bgSec: "#e0f2fe", text: "#0c4a6e", textSec: "#0369a1", accent: "#0ea5e9" },
    muted: { bg: "#f9fafb", bgSec: "#f3f4f6", text: "#374151", textSec: "#6b7280", accent: "#9ca3af" },
    "high-contrast": { bg: "#000000", bgSec: "#1f2937", text: "#ffffff", textSec: "#e5e7eb", accent: "#fbbf24" },
  };
  
  const colors = visual.darkMode
    ? { bg: "#1f2937", bgSec: "#374151", text: "#f9fafb", textSec: "#d1d5db", accent: "#818cf8" }
    : colorSchemes[visual.colorScheme];
  
  return {
    "--font-size-base": fontSizeMap[visual.fontSize],
    "--font-family": fontFamilyMap[visual.fontFamily],
    "--line-height": lineHeightMap[visual.lineSpacing],
    "--color-scheme": visual.darkMode ? "dark" : "light",
    "--bg-primary": colors.bg,
    "--bg-secondary": colors.bgSec,
    "--text-primary": colors.text,
    "--text-secondary": colors.textSec,
    "--accent-color": colors.accent,
    "--click-target-min": motor.largerClickTargets ? "48px" : "32px",
    "--element-spacing": motor.increaseSpacing ? "1.5rem" : "1rem",
    "--animation-duration": visual.reduceAnimations ? "0ms" : "300ms",
    "--transition-duration": visual.reduceMotion ? "0ms" : "150ms",
    "--hover-delay": `${motor.hoverDelay}ms`,
  };
}

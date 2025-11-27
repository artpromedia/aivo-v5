/**
 * Onboarding Types for AIVO v5
 * Progressive onboarding flow with role-specific steps
 */

import type { Role } from './roles';

// =============================================================================
// ONBOARDING STATUS
// =============================================================================

export type OnboardingStatus =
  | 'PENDING'             // Just registered, not started
  | 'EMAIL_VERIFIED'      // Email verified (if required)
  | 'PROFILE_COMPLETE'    // Basic profile filled
  | 'CHILD_ADDED'         // At least one learner added (for parents)
  | 'CLASS_SETUP'         // Class created (for teachers)
  | 'ASSESSMENT_PENDING'  // Learner exists, assessment not done
  | 'ASSESSMENT_COMPLETE' // Baseline assessment finished
  | 'COMPLETE';           // Full onboarding done

// =============================================================================
// ONBOARDING STEPS
// =============================================================================

export type OnboardingStepId =
  | 'welcome'
  | 'verify_email'
  | 'profile_setup'
  | 'organization_setup'
  | 'add_child'
  | 'add_class'
  | 'add_students'
  | 'initial_assessment'
  | 'preferences'
  | 'tutorial'
  | 'complete';

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  completedAt?: Date;
  skippedAt?: Date;
  order: number;
}

export interface OnboardingStepConfig {
  id: OnboardingStepId;
  title: string;
  description: string;
  isRequired: boolean;
  component: string; // Component name to render
  validationFn?: string; // Validation function name
  order: number;
}

// =============================================================================
// ROLE-SPECIFIC ONBOARDING FLOWS
// =============================================================================

export interface OnboardingFlow {
  role: Role;
  steps: OnboardingStepConfig[];
  estimatedTimeMinutes: number;
}

/**
 * Onboarding flows defined per role
 */
export const ONBOARDING_FLOWS: Record<Role, OnboardingStepConfig[]> = {
  // Platform Admin roles - minimal onboarding
  SUPER_ADMIN: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to AIVO Admin', isRequired: true, component: 'WelcomeStep', order: 1 },
    { id: 'profile_setup', title: 'Profile', description: 'Set up your admin profile', isRequired: true, component: 'ProfileStep', order: 2 },
    { id: 'preferences', title: 'Preferences', description: 'Configure your preferences', isRequired: false, component: 'PreferencesStep', order: 3 },
    { id: 'complete', title: 'Complete', description: 'Onboarding complete', isRequired: true, component: 'CompleteStep', order: 4 },
  ],
  GLOBAL_ADMIN: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to AIVO Admin', isRequired: true, component: 'WelcomeStep', order: 1 },
    { id: 'profile_setup', title: 'Profile', description: 'Set up your admin profile', isRequired: true, component: 'ProfileStep', order: 2 },
    { id: 'preferences', title: 'Preferences', description: 'Configure your preferences', isRequired: false, component: 'PreferencesStep', order: 3 },
    { id: 'complete', title: 'Complete', description: 'Onboarding complete', isRequired: true, component: 'CompleteStep', order: 4 },
  ],
  FINANCE_ADMIN: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to AIVO Finance', isRequired: true, component: 'WelcomeStep', order: 1 },
    { id: 'profile_setup', title: 'Profile', description: 'Set up your profile', isRequired: true, component: 'ProfileStep', order: 2 },
    { id: 'preferences', title: 'Preferences', description: 'Configure billing preferences', isRequired: false, component: 'PreferencesStep', order: 3 },
    { id: 'complete', title: 'Complete', description: 'Onboarding complete', isRequired: true, component: 'CompleteStep', order: 4 },
  ],
  TECH_SUPPORT: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to AIVO Support', isRequired: true, component: 'WelcomeStep', order: 1 },
    { id: 'profile_setup', title: 'Profile', description: 'Set up your profile', isRequired: true, component: 'ProfileStep', order: 2 },
    { id: 'tutorial', title: 'Tutorial', description: 'Learn support tools', isRequired: true, component: 'TutorialStep', order: 3 },
    { id: 'complete', title: 'Complete', description: 'Onboarding complete', isRequired: true, component: 'CompleteStep', order: 4 },
  ],
  LEGAL_COMPLIANCE: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to AIVO Compliance', isRequired: true, component: 'WelcomeStep', order: 1 },
    { id: 'profile_setup', title: 'Profile', description: 'Set up your profile', isRequired: true, component: 'ProfileStep', order: 2 },
    { id: 'preferences', title: 'Preferences', description: 'Configure compliance settings', isRequired: false, component: 'PreferencesStep', order: 3 },
    { id: 'complete', title: 'Complete', description: 'Onboarding complete', isRequired: true, component: 'CompleteStep', order: 4 },
  ],

  // Organizational roles
  DISTRICT_ADMIN: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to AIVO District Admin', isRequired: true, component: 'WelcomeStep', order: 1 },
    { id: 'profile_setup', title: 'Profile', description: 'Set up your district admin profile', isRequired: true, component: 'ProfileStep', order: 2 },
    { id: 'organization_setup', title: 'District Setup', description: 'Configure your district', isRequired: true, component: 'OrganizationSetupStep', order: 3 },
    { id: 'preferences', title: 'Preferences', description: 'Configure district preferences', isRequired: false, component: 'PreferencesStep', order: 4 },
    { id: 'tutorial', title: 'Tutorial', description: 'Learn district management', isRequired: false, component: 'TutorialStep', order: 5 },
    { id: 'complete', title: 'Complete', description: 'Onboarding complete', isRequired: true, component: 'CompleteStep', order: 6 },
  ],
  SCHOOL_ADMIN: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to AIVO School Admin', isRequired: true, component: 'WelcomeStep', order: 1 },
    { id: 'profile_setup', title: 'Profile', description: 'Set up your school admin profile', isRequired: true, component: 'ProfileStep', order: 2 },
    { id: 'organization_setup', title: 'School Setup', description: 'Configure your school', isRequired: true, component: 'OrganizationSetupStep', order: 3 },
    { id: 'preferences', title: 'Preferences', description: 'Configure school preferences', isRequired: false, component: 'PreferencesStep', order: 4 },
    { id: 'tutorial', title: 'Tutorial', description: 'Learn school management', isRequired: false, component: 'TutorialStep', order: 5 },
    { id: 'complete', title: 'Complete', description: 'Onboarding complete', isRequired: true, component: 'CompleteStep', order: 6 },
  ],

  // Educational roles
  TEACHER: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to AIVO for Teachers', isRequired: true, component: 'WelcomeStep', order: 1 },
    { id: 'verify_email', title: 'Verify Email', description: 'Confirm your email address', isRequired: true, component: 'VerifyEmailStep', order: 2 },
    { id: 'profile_setup', title: 'Profile', description: 'Set up your teacher profile', isRequired: true, component: 'TeacherProfileStep', order: 3 },
    { id: 'add_class', title: 'Create Class', description: 'Create your first class', isRequired: true, component: 'AddClassStep', order: 4 },
    { id: 'add_students', title: 'Add Students', description: 'Invite students to your class', isRequired: false, component: 'AddStudentsStep', order: 5 },
    { id: 'preferences', title: 'Preferences', description: 'Set your teaching preferences', isRequired: false, component: 'PreferencesStep', order: 6 },
    { id: 'tutorial', title: 'Tutorial', description: 'Learn AIVO features', isRequired: false, component: 'TutorialStep', order: 7 },
    { id: 'complete', title: 'Complete', description: 'Start teaching!', isRequired: true, component: 'CompleteStep', order: 8 },
  ],
  THERAPIST: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to AIVO for Therapists', isRequired: true, component: 'WelcomeStep', order: 1 },
    { id: 'verify_email', title: 'Verify Email', description: 'Confirm your email address', isRequired: true, component: 'VerifyEmailStep', order: 2 },
    { id: 'profile_setup', title: 'Profile', description: 'Set up your therapist profile', isRequired: true, component: 'TherapistProfileStep', order: 3 },
    { id: 'preferences', title: 'Preferences', description: 'Set therapy session preferences', isRequired: false, component: 'PreferencesStep', order: 4 },
    { id: 'tutorial', title: 'Tutorial', description: 'Learn AIVO therapy tools', isRequired: true, component: 'TutorialStep', order: 5 },
    { id: 'complete', title: 'Complete', description: 'Ready to help learners!', isRequired: true, component: 'CompleteStep', order: 6 },
  ],
  PARENT: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to AIVO for Parents', isRequired: true, component: 'WelcomeStep', order: 1 },
    { id: 'verify_email', title: 'Verify Email', description: 'Confirm your email address', isRequired: true, component: 'VerifyEmailStep', order: 2 },
    { id: 'profile_setup', title: 'Your Profile', description: 'Tell us about yourself', isRequired: true, component: 'ParentProfileStep', order: 3 },
    { id: 'add_child', title: 'Add Child', description: 'Add your child\'s profile', isRequired: true, component: 'AddChildStep', order: 4 },
    { id: 'initial_assessment', title: 'Assessment', description: 'Complete baseline assessment', isRequired: true, component: 'InitialAssessmentStep', order: 5 },
    { id: 'preferences', title: 'Preferences', description: 'Set learning preferences', isRequired: false, component: 'PreferencesStep', order: 6 },
    { id: 'tutorial', title: 'Tutorial', description: 'Learn how AIVO works', isRequired: false, component: 'TutorialStep', order: 7 },
    { id: 'complete', title: 'Complete', description: 'Start learning together!', isRequired: true, component: 'CompleteStep', order: 8 },
  ],
  LEARNER: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to AIVO!', isRequired: true, component: 'LearnerWelcomeStep', order: 1 },
    { id: 'profile_setup', title: 'About You', description: 'Tell us about yourself', isRequired: true, component: 'LearnerProfileStep', order: 2 },
    { id: 'initial_assessment', title: 'Fun Quiz', description: 'Let\'s see what you know!', isRequired: true, component: 'LearnerAssessmentStep', order: 3 },
    { id: 'preferences', title: 'Favorites', description: 'Pick your favorites', isRequired: false, component: 'LearnerPreferencesStep', order: 4 },
    { id: 'tutorial', title: 'How to Play', description: 'Learn how AIVO works', isRequired: false, component: 'LearnerTutorialStep', order: 5 },
    { id: 'complete', title: 'Ready!', description: 'Let\'s start learning!', isRequired: true, component: 'LearnerCompleteStep', order: 6 },
  ],
};

// =============================================================================
// ONBOARDING STATE & PROGRESS
// =============================================================================

export interface OnboardingState {
  userId: string;
  role: Role;
  status: OnboardingStatus;
  currentStepId: OnboardingStepId;
  steps: OnboardingStep[];
  startedAt: Date | null;
  completedAt: Date | null;
  progress: number; // 0-100
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  skippedSteps: number;
  progress: number; // 0-100
  estimatedTimeRemaining: number; // minutes
}

// =============================================================================
// ONBOARDING ANALYTICS
// =============================================================================

export type OnboardingAction = 'started' | 'completed' | 'skipped' | 'abandoned' | 'revisited';

export interface OnboardingAnalyticsEvent {
  userId: string;
  step: OnboardingStepId;
  action: OnboardingAction;
  timeSpentMs?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface GetOnboardingStatusResponse {
  status: OnboardingStatus;
  state: OnboardingState;
  progress: OnboardingProgress;
  isComplete: boolean;
}

export interface CompleteStepRequest {
  stepId: OnboardingStepId;
  timeSpentMs?: number;
  metadata?: Record<string, unknown>;
}

export interface CompleteStepResponse {
  success: boolean;
  nextStep: OnboardingStepId | null;
  state: OnboardingState;
  progress: OnboardingProgress;
}

export interface SkipStepRequest {
  stepId: OnboardingStepId;
  reason?: string;
}

export interface SkipStepResponse {
  success: boolean;
  skipped: boolean;
  nextStep: OnboardingStepId | null;
  state: OnboardingState;
}

export interface ResetOnboardingResponse {
  success: boolean;
  state: OnboardingState;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the onboarding flow for a specific role
 */
export function getOnboardingFlow(role: Role): OnboardingStepConfig[] {
  return ONBOARDING_FLOWS[role] || ONBOARDING_FLOWS.LEARNER;
}

/**
 * Calculate onboarding progress
 */
export function calculateProgress(steps: OnboardingStep[]): OnboardingProgress {
  const totalSteps = steps.length;
  const completedSteps = steps.filter(s => s.isCompleted).length;
  const skippedSteps = steps.filter(s => s.isSkipped).length;
  const currentStep = completedSteps + skippedSteps + 1;
  const progress = Math.round((completedSteps / totalSteps) * 100);
  const estimatedTimeRemaining = (totalSteps - completedSteps - skippedSteps) * 2; // ~2 min per step

  return {
    currentStep: Math.min(currentStep, totalSteps),
    totalSteps,
    completedSteps,
    skippedSteps,
    progress,
    estimatedTimeRemaining,
  };
}

/**
 * Get the next incomplete step
 */
export function getNextStep(steps: OnboardingStep[]): OnboardingStep | null {
  return steps.find(s => !s.isCompleted && !s.isSkipped) || null;
}

/**
 * Check if a step can be skipped
 */
export function canSkipStep(step: OnboardingStep | OnboardingStepConfig): boolean {
  return !step.isRequired;
}

/**
 * Check if onboarding is complete
 */
export function isOnboardingComplete(steps: OnboardingStep[]): boolean {
  return steps.filter(s => s.isRequired).every(s => s.isCompleted);
}

/**
 * Initialize onboarding steps from config
 */
export function initializeOnboardingSteps(role: Role): OnboardingStep[] {
  const configs = getOnboardingFlow(role);
  return configs.map(config => ({
    id: config.id,
    title: config.title,
    description: config.description,
    isRequired: config.isRequired,
    isCompleted: false,
    isSkipped: false,
    order: config.order,
  }));
}

/**
 * Get the status based on completed steps and role
 */
export function deriveOnboardingStatus(
  role: Role,
  steps: OnboardingStep[]
): OnboardingStatus {
  const completedIds = steps.filter(s => s.isCompleted).map(s => s.id);
  
  if (isOnboardingComplete(steps)) {
    return 'COMPLETE';
  }
  
  // Role-specific status derivation
  if (role === 'PARENT') {
    if (completedIds.includes('initial_assessment')) return 'ASSESSMENT_COMPLETE';
    if (completedIds.includes('add_child')) return 'ASSESSMENT_PENDING';
    if (completedIds.includes('profile_setup')) return 'CHILD_ADDED';
  }
  
  if (role === 'TEACHER') {
    if (completedIds.includes('add_class')) return 'CLASS_SETUP';
  }
  
  if (role === 'LEARNER') {
    if (completedIds.includes('initial_assessment')) return 'ASSESSMENT_COMPLETE';
    if (completedIds.includes('profile_setup')) return 'ASSESSMENT_PENDING';
  }
  
  // Generic status progression
  if (completedIds.includes('profile_setup')) return 'PROFILE_COMPLETE';
  if (completedIds.includes('verify_email')) return 'EMAIL_VERIFIED';
  
  return 'PENDING';
}

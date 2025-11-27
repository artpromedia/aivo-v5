/**
 * Onboarding Components for AIVO v5
 * Progressive onboarding flow with role-specific steps
 */

// Main wizard components
export {
  OnboardingWizard,
  OnboardingProgressBar,
  OnboardingStepIndicator,
  OnboardingStepContainer,
  OnboardingNavigation,
  OnboardingCheckIcon,
  OnboardingSkipIcon,
  OnboardingLoadingSpinner,
} from "./OnboardingWizard";

// Step components
export {
  WelcomeStep,
  ProfileStep,
  AddChildStep,
  AddClassStep,
  PreferencesStep,
  TutorialStep,
  CompleteStep,
  // Aliased exports
  OnboardingWelcomeStep,
  OnboardingProfileStep,
  OnboardingAddChildStep,
  OnboardingAddClassStep,
  OnboardingPreferencesStep,
  OnboardingTutorialStep,
  OnboardingCompleteStep,
} from "./OnboardingSteps";

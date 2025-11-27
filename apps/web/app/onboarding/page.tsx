"use client";

import { useRouter } from "next/navigation";
import { OnboardingProvider } from "@/lib/hooks/useOnboarding";
import {
  OnboardingWizard,
  WelcomeStep,
  ProfileStep,
  AddChildStep,
  AddClassStep,
  PreferencesStep,
  TutorialStep,
  CompleteStep,
} from "@/components/onboarding";

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = () => {
    // Redirect to dashboard after onboarding
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            <span className="text-blue-600">AIVO</span> Setup
          </h1>
          <p className="mt-2 text-gray-600">
            Let&apos;s get you started with AIVO
          </p>
        </div>

        <OnboardingProvider>
          <OnboardingWizard onComplete={handleComplete}>
            {/* Welcome step - all roles */}
            <WelcomeStep />

            {/* Profile setup - all roles */}
            <ProfileStep />

            {/* Add child - parent flow */}
            <AddChildStep />

            {/* Add class - teacher flow */}
            <AddClassStep />

            {/* Preferences - all roles */}
            <PreferencesStep />

            {/* Tutorial - all roles */}
            <TutorialStep />

            {/* Complete step - all roles */}
            <CompleteStep />
          </OnboardingWizard>
        </OnboardingProvider>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { OnboardingStepContainer } from "./OnboardingWizard";
import type { Role } from "@aivo/types";

// =============================================================================
// WELCOME STEP
// =============================================================================

interface WelcomeStepProps {
  userName?: string;
  role?: Role;
}

export function WelcomeStep({ userName, role }: WelcomeStepProps) {
  const roleMessages: Record<Role, { title: string; subtitle: string }> = {
    LEARNER: {
      title: "Welcome to AIVO! 🎉",
      subtitle: "Get ready for an amazing learning adventure!",
    },
    PARENT: {
      title: "Welcome to AIVO!",
      subtitle: "Let's set up your account to help your child succeed.",
    },
    TEACHER: {
      title: "Welcome to AIVO for Teachers!",
      subtitle: "Let's get your classroom set up for personalized learning.",
    },
    THERAPIST: {
      title: "Welcome to AIVO for Therapists!",
      subtitle: "Let's configure your therapy workspace.",
    },
    SCHOOL_ADMIN: {
      title: "Welcome to AIVO School Admin!",
      subtitle: "Let's set up your school for success.",
    },
    DISTRICT_ADMIN: {
      title: "Welcome to AIVO District Admin!",
      subtitle: "Let's configure your district settings.",
    },
    SUPER_ADMIN: {
      title: "Welcome, Super Admin!",
      subtitle: "Let's complete your administrator setup.",
    },
    GLOBAL_ADMIN: {
      title: "Welcome, Global Admin!",
      subtitle: "Let's complete your administrator setup.",
    },
    FINANCE_ADMIN: {
      title: "Welcome to AIVO Finance!",
      subtitle: "Let's set up your billing workspace.",
    },
    TECH_SUPPORT: {
      title: "Welcome to AIVO Support!",
      subtitle: "Let's get you ready to help users.",
    },
    LEGAL_COMPLIANCE: {
      title: "Welcome to AIVO Compliance!",
      subtitle: "Let's configure your compliance dashboard.",
    },
  };

  const message = role ? roleMessages[role] : roleMessages.LEARNER;

  return (
    <OnboardingStepContainer stepId="welcome">
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">👋</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {userName ? `Hi ${userName}!` : message.title}
        </h1>
        <p className="text-lg text-gray-600 mb-6">{message.subtitle}</p>
        <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            This quick setup will take about 5 minutes and help us personalize
            your experience.
          </p>
        </div>
      </div>
    </OnboardingStepContainer>
  );
}

// =============================================================================
// PROFILE SETUP STEP
// =============================================================================

interface ProfileStepProps {
  onSave?: (data: ProfileData) => void;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  phone?: string;
  timezone?: string;
}

export function ProfileStep({ onSave }: ProfileStepProps) {
  const [formData, setFormData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    phone: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <OnboardingStepContainer stepId="profile_setup">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Profile</h2>
        <p className="text-gray-600 mb-6">Tell us a bit about yourself.</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
        </div>
      </div>
    </OnboardingStepContainer>
  );
}

// =============================================================================
// ADD CHILD STEP (Parent flow)
// =============================================================================

interface ChildData {
  name: string;
  age: number | "";
  grade: string;
}

export function AddChildStep() {
  const [children, setChildren] = useState<ChildData[]>([
    { name: "", age: "", grade: "" },
  ]);

  const addChild = () => {
    setChildren([...children, { name: "", age: "", grade: "" }]);
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const updateChild = (index: number, field: keyof ChildData, value: string | number) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
  };

  return (
    <OnboardingStepContainer stepId="add_child">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Your Child</h2>
        <p className="text-gray-600 mb-6">
          Tell us about your child so we can personalize their learning experience.
        </p>

        <div className="space-y-6">
          {children.map((child, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  Child {children.length > 1 ? index + 1 : ""}
                </h3>
                {children.length > 1 && (
                  <button
                    onClick={() => removeChild(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={child.name}
                    onChange={(e) => updateChild(index, "name", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Child's name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age *
                    </label>
                    <input
                      type="number"
                      value={child.age}
                      onChange={(e) => updateChild(index, "age", parseInt(e.target.value) || "")}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="3"
                      max="18"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade
                    </label>
                    <select
                      value={child.grade}
                      onChange={(e) => updateChild(index, "grade", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select grade</option>
                      <option value="pre-k">Pre-K</option>
                      <option value="k">Kindergarten</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <option key={g} value={g.toString()}>
                          Grade {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addChild}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
          >
            + Add Another Child
          </button>
        </div>
      </div>
    </OnboardingStepContainer>
  );
}

// =============================================================================
// ADD CLASS STEP (Teacher flow)
// =============================================================================

export function AddClassStep() {
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  return (
    <OnboardingStepContainer stepId="add_class">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Class</h2>
        <p className="text-gray-600 mb-6">
          Set up your first class to start organizing your students.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name *
            </label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Math Period 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select subject</option>
              <option value="math">Mathematics</option>
              <option value="ela">English Language Arts</option>
              <option value="reading">Reading</option>
              <option value="science">Science</option>
              <option value="social_studies">Social Studies</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level *
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select grade level</option>
              <option value="k-2">K-2</option>
              <option value="3-5">3-5</option>
              <option value="6-8">6-8</option>
              <option value="9-12">9-12</option>
            </select>
          </div>
        </div>
      </div>
    </OnboardingStepContainer>
  );
}

// =============================================================================
// PREFERENCES STEP
// =============================================================================

export function PreferencesStep() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: true,
  });

  return (
    <OnboardingStepContainer stepId="preferences">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Preferences</h2>
        <p className="text-gray-600 mb-6">
          Customize how you want to receive updates and notifications.
        </p>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <div>
              <p className="font-medium text-gray-900">Email notifications</p>
              <p className="text-sm text-gray-500">
                Receive progress reports via email
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(e) =>
                setNotifications({ ...notifications, email: e.target.checked })
              }
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <div>
              <p className="font-medium text-gray-900">Push notifications</p>
              <p className="text-sm text-gray-500">
                Get real-time updates on your device
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications.push}
              onChange={(e) =>
                setNotifications({ ...notifications, push: e.target.checked })
              }
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <div>
              <p className="font-medium text-gray-900">Weekly summary</p>
              <p className="text-sm text-gray-500">
                Receive a weekly progress digest
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications.weekly}
              onChange={(e) =>
                setNotifications({ ...notifications, weekly: e.target.checked })
              }
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>
    </OnboardingStepContainer>
  );
}

// =============================================================================
// TUTORIAL STEP
// =============================================================================

export function TutorialStep() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: "📚",
      title: "Personalized Learning",
      description:
        "AIVO adapts to each learner's unique needs and learning style.",
    },
    {
      icon: "📊",
      title: "Track Progress",
      description:
        "Monitor learning progress with detailed analytics and insights.",
    },
    {
      icon: "🎯",
      title: "Set Goals",
      description:
        "Create learning goals and celebrate achievements along the way.",
    },
    {
      icon: "🤝",
      title: "Stay Connected",
      description:
        "Communicate with teachers and stay involved in the learning journey.",
    },
  ];

  return (
    <OnboardingStepContainer stepId="tutorial">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Tour</h2>
        <p className="text-gray-600 mb-6">
          Learn what you can do with AIVO.
        </p>

        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">{slides[currentSlide].icon}</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {slides[currentSlide].title}
          </h3>
          <p className="text-gray-600">{slides[currentSlide].description}</p>
        </div>

        <div className="flex items-center justify-center mt-6 space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "w-6 bg-blue-600"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="px-4 py-2 text-gray-600 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))
            }
            disabled={currentSlide === slides.length - 1}
            className="px-4 py-2 text-blue-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </OnboardingStepContainer>
  );
}

// =============================================================================
// COMPLETE STEP
// =============================================================================

interface CompleteStepProps {
  role?: Role;
}

export function CompleteStep({ role }: CompleteStepProps) {
  const messages: Record<Role, string> = {
    LEARNER: "You're all set to start your learning adventure!",
    PARENT: "You're ready to support your child's learning journey!",
    TEACHER: "Your classroom is ready for personalized learning!",
    THERAPIST: "Your therapy workspace is configured!",
    SCHOOL_ADMIN: "Your school is set up for success!",
    DISTRICT_ADMIN: "Your district configuration is complete!",
    SUPER_ADMIN: "Administrator setup complete!",
    GLOBAL_ADMIN: "Administrator setup complete!",
    FINANCE_ADMIN: "Finance workspace is ready!",
    TECH_SUPPORT: "Support tools are configured!",
    LEGAL_COMPLIANCE: "Compliance dashboard is ready!",
  };

  return (
    <OnboardingStepContainer stepId="complete">
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          All Done!
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          {role ? messages[role] : messages.LEARNER}
        </p>
        <div className="bg-green-50 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-green-800">
            Click &quot;Get Started&quot; to begin using AIVO.
          </p>
        </div>
      </div>
    </OnboardingStepContainer>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  WelcomeStep as OnboardingWelcomeStep,
  ProfileStep as OnboardingProfileStep,
  AddChildStep as OnboardingAddChildStep,
  AddClassStep as OnboardingAddClassStep,
  PreferencesStep as OnboardingPreferencesStep,
  TutorialStep as OnboardingTutorialStep,
  CompleteStep as OnboardingCompleteStep,
};

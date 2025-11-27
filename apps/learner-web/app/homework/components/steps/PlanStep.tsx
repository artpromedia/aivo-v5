/**
 * PlanStep - Second step of homework wizard
 * 
 * Breaks down the problem into a solution strategy with steps.
 */

"use client";

import { useState, useEffect } from "react";
import type { 
  SolutionPlan, 
  ProblemAnalysis,
  HomeworkDifficultyMode 
} from "@aivo/api-client/src/homework-contracts";

interface PlanStepProps {
  plan: SolutionPlan | null;
  analysis: ProblemAnalysis | null;
  loading: boolean;
  onNext: (inputData?: Record<string, unknown>) => void;
  difficultyMode: HomeworkDifficultyMode;
}

export function PlanStep({
  plan,
  analysis,
  loading,
  onNext,
  difficultyMode
}: PlanStepProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  // Reset checked steps when plan changes
  useEffect(() => {
    setCheckedSteps(new Set());
  }, [plan]);

  const toggleStep = (stepNumber: number) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  const toggleChecked = (stepNumber: number) => {
    setCheckedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };

  const allStepsChecked = plan 
    ? checkedSteps.size === plan.steps.length 
    : false;

  // Difficulty-based messages
  const getIntroText = () => {
    switch (difficultyMode) {
      case "SIMPLIFIED":
        return "Here's how we'll solve this together. Check each step when you feel ready!";
      case "STANDARD":
        return "Review the solution strategy and proceed when ready.";
      default:
        return "Let's break this down into smaller steps. Take your time reading each one!";
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center">
        <span className="text-4xl mb-4 block">📝</span>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Step 2: Make a Plan
        </h2>
        <p className="text-slate-600">
          {getIntroText()}
        </p>
      </div>

      {/* Loading state */}
      {loading && !plan && (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">
            Creating your game plan... 🎯
          </p>
        </div>
      )}

      {/* Plan display */}
      {plan && (
        <div className="space-y-4">
          {/* Approach summary */}
          <div className="p-4 bg-primary-50 rounded-xl">
            <h3 className="font-semibold text-primary-900 mb-2 flex items-center gap-2">
              <span>🎯</span>
              Our Approach
            </h3>
            <p className="text-primary-800">
              {plan.suggestedApproach}
            </p>
          </div>

          {/* Time estimate */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <span>⏱️</span>
            <span>Estimated time: {plan.estimatedTime} minutes</span>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800">Steps to Follow:</h3>
            
            {plan.steps.map((step, index) => (
              <div
                key={step.stepNumber}
                className={`
                  border rounded-xl overflow-hidden transition-all
                  ${checkedSteps.has(step.stepNumber)
                    ? "border-mint bg-mint/5"
                    : "border-slate-200 bg-white"
                  }
                `}
              >
                {/* Step header */}
                <button
                  onClick={() => toggleStep(step.stepNumber)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50"
                  aria-expanded={expandedStep === step.stepNumber}
                >
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleChecked(step.stepNumber);
                    }}
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      transition-colors
                      ${checkedSteps.has(step.stepNumber)
                        ? "border-mint bg-mint text-white"
                        : "border-slate-300 hover:border-primary-400"
                      }
                    `}
                    aria-label={`Mark step ${step.stepNumber} as understood`}
                  >
                    {checkedSteps.has(step.stepNumber) && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Step number and description */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary-600">
                        Step {step.stepNumber}
                      </span>
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${step.estimatedDifficulty === "easy"
                          ? "bg-mint/20 text-mint-dark"
                          : step.estimatedDifficulty === "medium"
                          ? "bg-sunshine/20 text-sunshine-dark"
                          : "bg-coral/20 text-coral-dark"
                        }
                      `}>
                        {step.estimatedDifficulty}
                      </span>
                    </div>
                    <p className="text-slate-700 mt-1">
                      {step.description}
                    </p>
                  </div>

                  {/* Expand icon */}
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      expandedStep === step.stepNumber ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded content */}
                {expandedStep === step.stepNumber && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <div className="pt-3 pl-9">
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-medium">Skill needed:</span>{" "}
                        {step.skill}
                      </p>
                      {difficultyMode !== "STANDARD" && (
                        <p className="text-sm text-slate-500 italic">
                          💡 Take your time with this step. It's okay to ask for a hint!
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Alternative approaches (for STANDARD mode) */}
          {difficultyMode === "STANDARD" && plan.alternativeApproaches && plan.alternativeApproaches.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-slate-800 mb-2">
                Alternative Approaches:
              </h3>
              <ul className="space-y-1">
                {plan.alternativeApproaches.map((approach, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-primary-500">→</span>
                    {approach}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="text-sm text-slate-500">
              {checkedSteps.size} of {plan.steps.length} steps reviewed
            </span>
          </div>
        </div>
      )}

      {/* Continue button */}
      {plan && (
        <div className="space-y-3">
          <button
            onClick={() => onNext({ confirmedPlan: true })}
            disabled={loading || (difficultyMode !== "STANDARD" && !allStepsChecked)}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold text-lg hover:from-primary-700 hover:to-primary-600 transition-all shadow-soft-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {difficultyMode === "SIMPLIFIED"
              ? "I'm ready! Let's solve it! ✨"
              : "Let's start solving →"}
          </button>
          
          {difficultyMode !== "STANDARD" && !allStepsChecked && (
            <p className="text-center text-sm text-slate-500">
              ☝️ Check all steps to continue
            </p>
          )}
        </div>
      )}

      {/* Encouragement */}
      {plan && difficultyMode !== "STANDARD" && (
        <div className="text-center py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            🌟 Remember: It's totally okay to take breaks between steps!
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * SolveStep - Third step of homework wizard
 * 
 * Provides step-by-step guidance with hints and checkpoints.
 */

"use client";

import { useState, useCallback } from "react";
import { HintButton } from "../HintButton";
import type { 
  SolutionStep, 
  SolutionPlan,
  ProblemAnalysis,
  HomeworkDifficultyMode 
} from "@aivo/api-client/src/homework-contracts";

interface SolveStepProps {
  steps: SolutionStep[];
  plan: SolutionPlan | null;
  analysis: ProblemAnalysis | null;
  loading: boolean;
  onNext: (inputData?: Record<string, unknown>) => void;
  onRequestHint: (hintType?: string) => void;
  currentHint: string | null;
  hintsRemaining: number;
  difficultyMode: HomeworkDifficultyMode;
}

interface StepWork {
  answer: string;
  checkpointAnswer: string;
  completed: boolean;
}

export function SolveStep({
  steps,
  plan,
  analysis,
  loading,
  onNext,
  onRequestHint,
  currentHint,
  hintsRemaining,
  difficultyMode
}: SolveStepProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepWork, setStepWork] = useState<Record<number, StepWork>>({});
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const currentSolutionStep = steps[currentStepIndex];
  const work = stepWork[currentStepIndex] || { answer: "", checkpointAnswer: "", completed: false };
  const isLastStep = currentStepIndex === steps.length - 1;
  const allStepsCompleted = steps.every((_, i) => stepWork[i]?.completed);

  const updateWork = useCallback((updates: Partial<StepWork>) => {
    setStepWork((prev) => ({
      ...prev,
      [currentStepIndex]: { ...work, ...updates }
    }));
  }, [currentStepIndex, work]);

  const handleCompleteStep = useCallback(() => {
    updateWork({ completed: true });
    setShowCheckpoint(false);
    setShowExample(false);
    
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [updateWork, isLastStep]);

  const handleGoBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setShowCheckpoint(false);
      setShowExample(false);
    }
  }, [currentStepIndex]);

  // Difficulty-based messages
  const getInstructionPrefix = () => {
    switch (difficultyMode) {
      case "SIMPLIFIED":
        return "Let's do this together! ";
      case "STANDARD":
        return "";
      default:
        return "Take your time: ";
    }
  };

  if (!currentSolutionStep) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">Loading solution steps...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <span className="text-4xl mb-4 block">✨</span>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Step 3: Solve It
        </h2>
        <p className="text-slate-600">
          {difficultyMode === "SIMPLIFIED"
            ? "Follow along and work through each part!"
            : "Work through each step. Take your time!"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(((currentStepIndex + (work.completed ? 1 : 0)) / steps.length) * 100)}% complete</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-mint transition-all duration-300"
            style={{ width: `${((currentStepIndex + (work.completed ? 1 : 0)) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current step card */}
      <div className="bg-white border-2 border-primary-200 rounded-2xl overflow-hidden">
        {/* Step header */}
        <div className="bg-primary-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              {currentSolutionStep.stepNumber}
            </div>
            <span className="font-semibold text-primary-900">
              Current Step
            </span>
          </div>
          {work.completed && (
            <span className="px-3 py-1 bg-mint/20 text-mint-dark rounded-full text-sm font-medium">
              ✓ Done
            </span>
          )}
        </div>

        {/* Step content */}
        <div className="p-6 space-y-4">
          {/* Instruction */}
          <div className="bg-lavender-50 rounded-xl p-4">
            <p className="text-slate-800 text-lg">
              {getInstructionPrefix()}
              {currentSolutionStep.instruction}
            </p>
          </div>

          {/* Expected outcome (for scaffolded/simplified) */}
          {difficultyMode !== "STANDARD" && (
            <div className="flex items-start gap-3 p-3 bg-sky/10 rounded-lg">
              <span className="text-sky">💭</span>
              <div>
                <p className="text-sm font-medium text-sky-dark">
                  What we're looking for:
                </p>
                <p className="text-sm text-slate-600">
                  {currentSolutionStep.expectedOutcome}
                </p>
              </div>
            </div>
          )}

          {/* Work area */}
          <div>
            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-2 block">
                Your work for this step:
              </span>
              <textarea
                value={work.answer}
                onChange={(e) => updateWork({ answer: e.target.value })}
                placeholder={
                  difficultyMode === "SIMPLIFIED"
                    ? "Write or describe what you did here..."
                    : "Show your work here..."
                }
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                disabled={loading}
              />
            </label>
          </div>

          {/* Hint (integrated) */}
          {currentHint && (
            <div className="p-4 bg-sunshine/10 border border-sunshine/30 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="font-medium text-sunshine-dark mb-1">Hint:</p>
                  <p className="text-slate-700">{currentHint}</p>
                </div>
              </div>
            </div>
          )}

          {/* Example toggle (for scaffolded/simplified) */}
          {difficultyMode !== "STANDARD" && currentSolutionStep.example && (
            <div>
              <button
                onClick={() => setShowExample(!showExample)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <span>{showExample ? "Hide" : "Show"} example</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showExample ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showExample && (
                <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-sm font-medium text-slate-500 mb-2">Example:</p>
                  <p className="text-slate-700">{currentSolutionStep.example}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Checkpoint */}
        {!work.completed && (
          <div className="px-6 pb-6">
            <button
              onClick={() => setShowCheckpoint(true)}
              disabled={!work.answer.trim()}
              className="w-full py-3 bg-primary-100 text-primary-700 rounded-xl font-medium hover:bg-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              I've done this step - check my understanding
            </button>
          </div>
        )}
      </div>

      {/* Checkpoint modal */}
      {showCheckpoint && !work.completed && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🎯</span>
              Quick Check
            </h3>
            <p className="text-slate-700 mb-4">
              {currentSolutionStep.checkPoint}
            </p>
            <textarea
              value={work.checkpointAnswer}
              onChange={(e) => updateWork({ checkpointAnswer: e.target.value })}
              placeholder="Your answer..."
              rows={2}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckpoint(false)}
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
              >
                Go back
              </button>
              <button
                onClick={handleCompleteStep}
                disabled={!work.checkpointAnswer.trim()}
                className="flex-1 py-3 bg-mint text-white rounded-xl font-medium hover:bg-mint/90 disabled:opacity-50"
              >
                {isLastStep ? "Complete! ✓" : "Next step →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={handleGoBack}
          disabled={currentStepIndex === 0}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        
        <div className="flex-1">
          {/* Hint button in the middle */}
          <HintButton
            hintsRemaining={hintsRemaining}
            onRequestHint={onRequestHint}
            disabled={loading}
            maxHints={3}
          />
        </div>

        {work.completed && !isLastStep && (
          <button
            onClick={() => setCurrentStepIndex((prev) => prev + 1)}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
          >
            Next →
          </button>
        )}
      </div>

      {/* Completed steps summary */}
      {Object.keys(stepWork).length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <h4 className="text-sm font-medium text-slate-600 mb-2">
            Completed steps:
          </h4>
          <div className="flex flex-wrap gap-2">
            {steps.map((step, i) => (
              <button
                key={step.stepNumber}
                onClick={() => {
                  setCurrentStepIndex(i);
                  setShowCheckpoint(false);
                  setShowExample(false);
                }}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  transition-colors
                  ${stepWork[i]?.completed
                    ? "bg-mint text-white"
                    : i === currentStepIndex
                    ? "bg-primary-600 text-white"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }
                `}
              >
                {step.stepNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Continue to check */}
      {allStepsCompleted && (
        <button
          onClick={() => onNext({ 
            stepWork: Object.entries(stepWork).map(([i, w]) => ({
              stepNumber: parseInt(i) + 1,
              answer: w.answer,
              checkpointAnswer: w.checkpointAnswer
            }))
          })}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-mint to-primary-500 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-lg"
        >
          {difficultyMode === "SIMPLIFIED"
            ? "Yay! Let's check if it's right! ✅"
            : "All done! Let's verify →"}
        </button>
      )}

      {/* Encouragement */}
      {difficultyMode !== "STANDARD" && !allStepsCompleted && (
        <p className="text-center text-sm text-slate-500">
          💪 You're doing great! Take breaks whenever you need them.
        </p>
      )}
    </div>
  );
}

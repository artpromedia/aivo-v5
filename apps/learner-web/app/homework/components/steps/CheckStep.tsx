/**
 * CheckStep - Fourth step of homework wizard
 * 
 * Verifies the solution and provides feedback with explanations.
 */

"use client";

import { useState, useCallback } from "react";
import type { 
  VerificationResult,
  ProblemAnalysis,
  SolutionStep,
  HomeworkDifficultyMode 
} from "@aivo/api-client/src/homework-contracts";

interface CheckStepProps {
  verification: VerificationResult | null;
  analysis: ProblemAnalysis | null;
  solutionSteps: SolutionStep[];
  loading: boolean;
  onCheck: (solution: string, showWork?: string) => void;
  onNext: () => void;
  difficultyMode: HomeworkDifficultyMode;
}

export function CheckStep({
  verification,
  analysis,
  solutionSteps,
  loading,
  onCheck,
  onNext,
  difficultyMode
}: CheckStepProps) {
  const [finalAnswer, setFinalAnswer] = useState("");
  const [showWork, setShowWork] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSubmit = useCallback(() => {
    if (finalAnswer.trim()) {
      onCheck(finalAnswer.trim(), showWork.trim() || undefined);
    }
  }, [finalAnswer, showWork, onCheck]);

  // Difficulty-based messages
  const getInstructionText = () => {
    switch (difficultyMode) {
      case "SIMPLIFIED":
        return "What's your final answer? Write it below and I'll help check if it's right!";
      case "STANDARD":
        return "Enter your final answer for verification.";
      default:
        return "Let's check your work! Enter your final answer below.";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <span className="text-4xl mb-4 block">✅</span>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Step 4: Check Your Work
        </h2>
        <p className="text-slate-600">
          {getInstructionText()}
        </p>
      </div>

      {/* Answer input (before verification) */}
      {!verification && (
        <div className="space-y-4">
          {/* Final answer */}
          <div className="p-6 bg-white border-2 border-primary-200 rounded-2xl">
            <label className="block">
              <span className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span>🎯</span>
                Your Final Answer
              </span>
              <textarea
                value={finalAnswer}
                onChange={(e) => setFinalAnswer(e.target.value)}
                placeholder={
                  difficultyMode === "SIMPLIFIED"
                    ? "Type your answer here..."
                    : "Enter your solution..."
                }
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                disabled={loading}
              />
            </label>
          </div>

          {/* Show work (optional for scaffolded/simplified) */}
          {difficultyMode !== "STANDARD" && (
            <div className="p-4 bg-lavender-50 rounded-xl">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <span>📝</span>
                  Show your work (optional)
                </span>
                <textarea
                  value={showWork}
                  onChange={(e) => setShowWork(e.target.value)}
                  placeholder="Write out the steps you took..."
                  rows={4}
                  className="w-full px-4 py-3 border border-lavender-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white resize-none"
                  disabled={loading}
                />
              </label>
              <p className="text-xs text-slate-500 mt-2">
                💡 Showing your work helps you get better feedback!
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!finalAnswer.trim() || loading}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-mint text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking...
              </span>
            ) : difficultyMode === "SIMPLIFIED" ? (
              "Check my answer! 🔍"
            ) : (
              "Verify Solution"
            )}
          </button>
        </div>
      )}

      {/* Verification result */}
      {verification && (
        <div className="space-y-4">
          {/* Result banner */}
          <div className={`
            p-6 rounded-2xl text-center
            ${verification.isCorrect
              ? "bg-gradient-to-br from-mint/20 to-mint/10 border-2 border-mint"
              : "bg-gradient-to-br from-sunshine/20 to-sunshine/10 border-2 border-sunshine"
            }
          `}>
            <span className="text-5xl block mb-3">
              {verification.isCorrect ? "🎉" : "🤔"}
            </span>
            <h3 className={`text-2xl font-bold mb-2 ${
              verification.isCorrect ? "text-mint-dark" : "text-sunshine-dark"
            }`}>
              {verification.isCorrect
                ? "Great job!"
                : "Let's take another look"}
            </h3>
            <p className="text-slate-700">
              {verification.feedback}
            </p>
            
            {/* Confidence indicator */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-sm text-slate-500">Confidence:</span>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    verification.isCorrect ? "bg-mint" : "bg-sunshine"
                  }`}
                  style={{ width: `${verification.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-600">
                {Math.round(verification.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Explanation */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="font-semibold text-slate-800 flex items-center gap-2">
                <span>💡</span>
                {verification.isCorrect ? "Understanding the solution" : "Let me explain"}
              </span>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform ${
                  showExplanation ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showExplanation && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-slate-700 leading-relaxed">
                  {verification.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Common mistakes (if incorrect) */}
          {!verification.isCorrect && verification.commonMistakes && verification.commonMistakes.length > 0 && (
            <div className="p-4 bg-coral-light/50 rounded-xl">
              <h4 className="font-semibold text-coral-dark mb-2 flex items-center gap-2">
                <span>⚠️</span>
                Common mistakes to avoid:
              </h4>
              <ul className="space-y-2">
                {verification.commonMistakes.map((mistake, i) => (
                  <li key={i} className="text-slate-700 flex items-start gap-2">
                    <span className="text-coral">•</span>
                    {mistake}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next steps */}
          {verification.nextSteps && verification.nextSteps.length > 0 && (
            <div className="p-4 bg-sky/10 rounded-xl">
              <h4 className="font-semibold text-sky-dark mb-2 flex items-center gap-2">
                <span>🚀</span>
                {verification.isCorrect ? "Next challenges:" : "Try this next:"}
              </h4>
              <ul className="space-y-2">
                {verification.nextSteps.map((step, i) => (
                  <li key={i} className="text-slate-700 flex items-start gap-2">
                    <span className="text-sky">→</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {!verification.isCorrect && (
              <button
                onClick={() => {
                  // Reset to try again
                  setFinalAnswer("");
                  setShowWork("");
                }}
                className="flex-1 py-3 border border-primary-300 text-primary-700 rounded-xl font-medium hover:bg-primary-50"
              >
                Try Again
              </button>
            )}
            <button
              onClick={onNext}
              disabled={loading}
              className={`
                flex-1 py-4 bg-gradient-to-r text-white rounded-xl font-semibold
                hover:opacity-90 transition-all shadow-lg
                ${verification.isCorrect
                  ? "from-mint to-primary-500"
                  : "from-primary-600 to-primary-500"
                }
              `}
            >
              {verification.isCorrect
                ? difficultyMode === "SIMPLIFIED"
                  ? "Yay! I'm done! 🎉"
                  : "Complete! 🎉"
                : difficultyMode === "SIMPLIFIED"
                ? "I understand, let's finish"
                : "Mark as Complete"
              }
            </button>
          </div>
        </div>
      )}

      {/* Encouragement for non-standard modes */}
      {!verification && difficultyMode !== "STANDARD" && (
        <div className="text-center py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            🌟 Don't worry about being perfect - making mistakes helps us learn!
          </p>
        </div>
      )}
    </div>
  );
}

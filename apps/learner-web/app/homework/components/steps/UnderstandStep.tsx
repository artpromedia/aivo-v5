/**
 * UnderstandStep - First step of homework wizard
 * 
 * Handles:
 * - File upload with OCR
 * - Text input
 * - Problem analysis display
 */

"use client";

import { useState, useCallback } from "react";
import { FileUploadZone } from "../FileUploadZone";
import type { 
  ProblemAnalysis, 
  HomeworkDifficultyMode 
} from "@aivo/api-client/src/homework-contracts";

interface UnderstandStepProps {
  analysis: ProblemAnalysis | null;
  problemText: string;
  uploadedFiles: File[];
  loading: boolean;
  onFileUpload: (files: File[]) => void;
  onTextSubmit: (text: string) => void;
  onNext: () => void;
  difficultyMode: HomeworkDifficultyMode;
}

export function UnderstandStep({
  analysis,
  problemText,
  uploadedFiles,
  loading,
  onFileUpload,
  onTextSubmit,
  onNext,
  difficultyMode
}: UnderstandStepProps) {
  const [inputMode, setInputMode] = useState<"upload" | "text">("upload");
  const [textInput, setTextInput] = useState(problemText);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      onTextSubmit(textInput.trim());
    }
  }, [textInput, onTextSubmit]);

  const canProceed = analysis !== null;

  // Difficulty-based language adjustments
  const getPromptText = () => {
    switch (difficultyMode) {
      case "SIMPLIFIED":
        return "Show me your homework! You can take a picture or type it out.";
      case "STANDARD":
        return "Upload your homework problem or enter it below.";
      default:
        return "Let's look at your homework together! Take a photo or type the problem.";
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center">
        <span className="text-4xl mb-4 block">🔍</span>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Step 1: Understand the Problem
        </h2>
        <p className="text-slate-600">
          {getPromptText()}
        </p>
      </div>

      {/* Input mode toggle */}
      {!analysis && (
        <div className="flex justify-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setInputMode("upload")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              inputMode === "upload"
                ? "bg-white text-primary-700 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            📷 Upload Photo
          </button>
          <button
            onClick={() => setInputMode("text")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              inputMode === "text"
                ? "bg-white text-primary-700 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            ✏️ Type It
          </button>
        </div>
      )}

      {/* File upload zone */}
      {inputMode === "upload" && !analysis && (
        <FileUploadZone
          onFilesSelected={onFileUpload}
          disabled={loading}
          maxFiles={3}
        />
      )}

      {/* Text input */}
      {inputMode === "text" && !analysis && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-2 block">
              Type or paste your homework problem:
            </span>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Example: Solve for x: 2x + 5 = 15"
              rows={5}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              disabled={loading}
            />
          </label>
          <button
            onClick={handleTextSubmit}
            disabled={!textInput.trim() || loading}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              "Analyze Problem"
            )}
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !analysis && (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">
            Reading your homework... 📖
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {uploadedFiles.length > 0 
              ? "Using AI to understand the problem from your photo"
              : "Analyzing the problem..."}
          </p>
        </div>
      )}

      {/* Analysis result */}
      {analysis && (
        <div className="space-y-4">
          {/* Problem text */}
          <div className="p-4 bg-lavender-50 rounded-xl">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span>📝</span>
              Your Problem
            </h3>
            <p className="text-slate-700 font-mono text-lg">
              {analysis.extractedProblem}
            </p>
          </div>

          {/* What we found */}
          <div className="grid grid-cols-2 gap-4">
            {/* Subject & Grade */}
            <div className="p-4 bg-mint/10 rounded-xl">
              <p className="text-sm text-slate-500">Subject</p>
              <p className="font-semibold text-mint-dark capitalize">
                {analysis.subject}
              </p>
            </div>
            <div className="p-4 bg-sky/10 rounded-xl">
              <p className="text-sm text-slate-500">Grade Level</p>
              <p className="font-semibold text-sky-dark">
                Grade {analysis.gradeLevel}
              </p>
            </div>
          </div>

          {/* Problem type */}
          <div className="p-4 bg-sunshine/10 rounded-xl">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span>🎯</span>
              Problem Type
            </h3>
            <p className="text-slate-700 capitalize">{analysis.problemType.replace(/_/g, " ")}</p>
          </div>

          {/* Key concepts */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span>🧩</span>
              Key Concepts
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.concepts.map((concept, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>

          {/* Prerequisites (for SCAFFOLDED and SIMPLIFIED modes) */}
          {difficultyMode !== "STANDARD" && analysis.prerequisites.length > 0 && (
            <div className="p-4 bg-lavender-50 rounded-xl">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span>📚</span>
                You should know
              </h3>
              <ul className="space-y-1">
                {analysis.prerequisites.map((prereq, i) => (
                  <li key={i} className="text-slate-600 flex items-center gap-2">
                    <span className="text-mint">✓</span>
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Difficulty indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="text-sm text-slate-500">Difficulty:</span>
            <div className="flex gap-1">
              {["easy", "medium", "hard"].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-full ${
                    analysis.difficulty === level ||
                    (level === "easy" && analysis.difficulty !== "hard" && analysis.difficulty !== "medium") ||
                    (level === "medium" && analysis.difficulty === "hard")
                      ? analysis.difficulty === "easy"
                        ? "bg-mint"
                        : analysis.difficulty === "medium"
                        ? "bg-sunshine"
                        : "bg-coral"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-slate-700 capitalize">
              {analysis.difficulty}
            </span>
          </div>
        </div>
      )}

      {/* Continue button */}
      {analysis && (
        <button
          onClick={onNext}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold text-lg hover:from-primary-700 hover:to-primary-600 transition-all shadow-soft-primary disabled:opacity-50"
        >
          {difficultyMode === "SIMPLIFIED"
            ? "I understand! Let's make a plan 📝"
            : "Got it! Let's plan how to solve it →"}
        </button>
      )}

      {/* Helpful tip */}
      {!analysis && (
        <div className="text-center text-sm text-slate-500 mt-4">
          <span className="inline-flex items-center gap-1">
            <span>💡</span>
            Tip: Make sure the problem is clearly visible in your photo!
          </span>
        </div>
      )}
    </div>
  );
}

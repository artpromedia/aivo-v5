/**
 * HomeworkHelper - Main 4-Step Wizard Component
 * 
 * Provides scaffolded homework assistance through:
 * 1. UNDERSTAND - Extract & analyze the problem
 * 2. PLAN - Break down the solution strategy
 * 3. SOLVE - Step-by-step guidance with hints
 * 4. CHECK - Verify solution and explain reasoning
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepProgress } from "./StepProgress";
import { FileUploadZone } from "./FileUploadZone";
import { UnderstandStep } from "./steps/UnderstandStep";
import { PlanStep } from "./steps/PlanStep";
import { SolveStep } from "./steps/SolveStep";
import { CheckStep } from "./steps/CheckStep";
import { HintButton } from "./HintButton";
import type {
  HomeworkSession,
  HomeworkSessionStatus,
  HomeworkDifficultyMode,
  ProblemAnalysis,
  SolutionPlan,
  SolutionStep,
  VerificationResult
} from "@aivo/api-client/src/homework-contracts";

interface HomeworkHelperProps {
  learnerId: string;
  learnerName?: string;
  gradeLevel?: number;
  onComplete?: (session: HomeworkSession) => void;
  parentAssistMode?: boolean;
  initialDifficultyMode?: HomeworkDifficultyMode;
}

const STEPS: HomeworkSessionStatus[] = ["UNDERSTAND", "PLAN", "SOLVE", "CHECK", "COMPLETE"];

const STEP_LABELS: Record<HomeworkSessionStatus, string> = {
  UNDERSTAND: "Understand",
  PLAN: "Plan",
  SOLVE: "Solve",
  CHECK: "Check",
  COMPLETE: "Done!"
};

const STEP_DESCRIPTIONS: Record<HomeworkSessionStatus, string> = {
  UNDERSTAND: "Let's look at this problem together",
  PLAN: "How should we approach this?",
  SOLVE: "Work through it step by step",
  CHECK: "Let's make sure it's right",
  COMPLETE: "Great job! You did it!"
};

const STEP_EMOJIS: Record<HomeworkSessionStatus, string> = {
  UNDERSTAND: "🔍",
  PLAN: "📝",
  SOLVE: "✨",
  CHECK: "✅",
  COMPLETE: "🎉"
};

export function HomeworkHelper({
  learnerId,
  learnerName = "Friend",
  gradeLevel,
  onComplete,
  parentAssistMode = false,
  initialDifficultyMode = "SCAFFOLDED"
}: HomeworkHelperProps) {
  const router = useRouter();
  
  // Session state
  const [session, setSession] = useState<HomeworkSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step data
  const [analysis, setAnalysis] = useState<ProblemAnalysis | null>(null);
  const [plan, setPlan] = useState<SolutionPlan | null>(null);
  const [solutionSteps, setSolutionSteps] = useState<SolutionStep[]>([]);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  
  // Hints
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  
  // Input state
  const [problemText, setProblemText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const currentStep = session?.status ?? "UNDERSTAND";
  const currentStepIndex = STEPS.indexOf(currentStep);

  // Create a new homework session
  const createSession = useCallback(async (title: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/homework/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId,
          title,
          gradeLevel,
          difficultyMode: initialDifficultyMode,
          parentAssistMode
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create homework session");
      }

      const data = await response.json();
      setSession(data.session);
      setHintsRemaining(data.session.maxHintsPerStep);
      return data.session;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  }, [learnerId, gradeLevel, initialDifficultyMode, parentAssistMode]);

  // Handle file upload with OCR
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (!session && files.length > 0) {
      // Create session first
      const newSession = await createSession(files[0].name || "Homework Problem");
      if (!newSession) return;
    }

    const sessionId = session?.id;
    if (!sessionId) return;

    setLoading(true);
    setUploadedFiles(files);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("filename", file.name);
        formData.append("inputType", file.type.includes("image") ? "CAMERA" : "DOCUMENT");

        const response = await fetch(`/api/homework/sessions/${sessionId}/upload`, {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        const data = await response.json();
        
        if (data.analysis) {
          setAnalysis(data.analysis);
        }
        
        if (data.session) {
          setSession(data.session);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file");
    } finally {
      setLoading(false);
    }
  }, [session, createSession]);

  // Handle text input
  const handleTextSubmit = useCallback(async (text: string) => {
    if (!text.trim()) return;

    let sessionId = session?.id;
    
    if (!sessionId) {
      const newSession = await createSession("Homework Problem");
      if (!newSession) return;
      sessionId = newSession.id;
    }

    setLoading(true);
    setProblemText(text);

    try {
      const response = await fetch(`/api/homework/sessions/${sessionId}/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error("Failed to submit problem text");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setSession(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze problem");
    } finally {
      setLoading(false);
    }
  }, [session, createSession]);

  // Progress to next step
  const handleNextStep = useCallback(async (inputData?: Record<string, unknown>) => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/homework/sessions/${session.id}/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStep,
          inputData
        })
      });

      if (!response.ok) {
        throw new Error("Failed to progress to next step");
      }

      const data = await response.json();
      setSession(data.session);
      setHintsRemaining(data.session.maxHintsPerStep);
      setCurrentHint(null);

      // Update step-specific data
      if (data.nextStepGuidance) {
        const nextStep = data.session.status;
        
        if (nextStep === "PLAN") {
          setPlan(data.nextStepGuidance as SolutionPlan);
        } else if (nextStep === "SOLVE") {
          setSolutionSteps(data.nextStepGuidance as SolutionStep[]);
        } else if (nextStep === "CHECK") {
          // Keep existing solution steps
        } else if (nextStep === "COMPLETE") {
          setVerification(data.nextStepGuidance as VerificationResult);
          onComplete?.(data.session);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [session, currentStep, onComplete]);

  // Request a hint
  const handleRequestHint = useCallback(async (hintType?: string) => {
    if (!session || hintsRemaining <= 0) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/homework/sessions/${session.id}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: currentStep,
          hintType
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get hint");
      }

      const data = await response.json();
      setCurrentHint(data.hint.content);
      setHintsRemaining(data.hintsRemaining);
      setSession(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't get a hint right now");
    } finally {
      setLoading(false);
    }
  }, [session, currentStep, hintsRemaining]);

  // Check solution
  const handleCheckSolution = useCallback(async (solution: string, showWork?: string) => {
    if (!session) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/homework/sessions/${session.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solution, showWork })
      });

      if (!response.ok) {
        throw new Error("Failed to check solution");
      }

      const data = await response.json();
      setVerification(data.verification);
      setSession(data.session);

      if (data.session.status === "COMPLETE") {
        onComplete?.(data.session);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't verify the solution");
    } finally {
      setLoading(false);
    }
  }, [session, onComplete]);

  // Render the appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "UNDERSTAND":
        return (
          <UnderstandStep
            analysis={analysis}
            problemText={problemText}
            uploadedFiles={uploadedFiles}
            loading={loading}
            onFileUpload={handleFileUpload}
            onTextSubmit={handleTextSubmit}
            onNext={handleNextStep}
            difficultyMode={session?.difficultyMode ?? initialDifficultyMode}
          />
        );

      case "PLAN":
        return (
          <PlanStep
            plan={plan}
            analysis={analysis}
            loading={loading}
            onNext={handleNextStep}
            difficultyMode={session?.difficultyMode ?? initialDifficultyMode}
          />
        );

      case "SOLVE":
        return (
          <SolveStep
            steps={solutionSteps}
            plan={plan}
            analysis={analysis}
            loading={loading}
            onNext={handleNextStep}
            onRequestHint={handleRequestHint}
            currentHint={currentHint}
            hintsRemaining={hintsRemaining}
            difficultyMode={session?.difficultyMode ?? initialDifficultyMode}
          />
        );

      case "CHECK":
        return (
          <CheckStep
            verification={verification}
            analysis={analysis}
            solutionSteps={solutionSteps}
            loading={loading}
            onCheck={handleCheckSolution}
            onNext={handleNextStep}
            difficultyMode={session?.difficultyMode ?? initialDifficultyMode}
          />
        );

      case "COMPLETE":
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Amazing work, {learnerName}!
            </h2>
            <p className="text-slate-600 mb-6">
              You completed this homework problem!
            </p>
            {verification && (
              <div className="bg-mint/20 rounded-xl p-6 text-left max-w-md mx-auto">
                <h3 className="font-semibold text-mint-dark mb-2">
                  What you learned:
                </h3>
                <p className="text-slate-700">{verification.explanation}</p>
              </div>
            )}
            <button
              onClick={() => router.push("/homework")}
              className="mt-8 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              Back to Homework List
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-lavender-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{STEP_EMOJIS[currentStep]}</span>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Homework Helper
              </h1>
              <p className="text-sm text-slate-500">
                {STEP_DESCRIPTIONS[currentStep]}
              </p>
            </div>
          </div>
          
          {session && currentStep !== "UNDERSTAND" && currentStep !== "COMPLETE" && (
            <HintButton
              hintsRemaining={hintsRemaining}
              onRequestHint={handleRequestHint}
              disabled={loading || hintsRemaining <= 0}
              currentHint={currentHint}
            />
          )}
        </div>
      </header>

      {/* Progress indicator */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <StepProgress
            steps={STEPS.slice(0, -1)} // Exclude COMPLETE from progress
            currentStep={currentStepIndex}
            labels={STEP_LABELS}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-coral-light rounded-xl flex items-center gap-3">
            <span className="text-xl">😅</span>
            <div>
              <p className="font-medium text-coral-dark">Oops!</p>
              <p className="text-sm text-slate-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-slate-500 hover:text-slate-700"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
          {renderStepContent()}
        </div>

        {/* Parent assist mode indicator */}
        {parentAssistMode && (
          <div className="mt-4 p-3 bg-sunshine/20 rounded-xl text-center text-sm text-sunshine-dark">
            👨‍👩‍👧 Parent Assist Mode - You can see progress without seeing answers
          </div>
        )}
      </main>
    </div>
  );
}

export default HomeworkHelper;

/**
 * Homework Helper API Client Hooks
 * 
 * React hooks for interacting with the homework helper API
 */

"use client";

import { useState, useCallback } from "react";
import type {
  HomeworkSession,
  HomeworkFile,
  HomeworkHint,
  HomeworkWorkProduct,
  CreateHomeworkSessionRequest,
  CreateHomeworkSessionResponse,
  ListHomeworkSessionsResponse,
  UploadHomeworkFileResponse,
  SubmitTextInputResponse,
  RequestHintResponse,
  ProgressStepResponse,
  CheckSolutionResponse,
  ProblemAnalysis,
  SolutionPlan,
  SolutionStep,
  VerificationResult,
  HomeworkSessionStatus,
  HomeworkHintType,
  HomeworkDifficultyMode
} from "@aivo/api-client/src/homework-contracts";

const API_BASE = "/api/homework";

// ============================================================================
// API Functions
// ============================================================================

async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Request failed");
  }

  return response.json();
}

// ============================================================================
// Session Management
// ============================================================================

export function useHomeworkSessions(learnerId: string) {
  const [sessions, setSessions] = useState<HomeworkSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (status?: HomeworkSessionStatus) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ learnerId });
      if (status) params.append("status", status);
      
      const data = await apiRequest<ListHomeworkSessionsResponse>(
        `${API_BASE}/sessions?${params}`
      );
      setSessions(data.sessions);
      return data.sessions;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
      return [];
    } finally {
      setLoading(false);
    }
  }, [learnerId]);

  const createSession = useCallback(async (
    title: string,
    options?: {
      subject?: string;
      gradeLevel?: number;
      difficultyMode?: HomeworkDifficultyMode;
      parentAssistMode?: boolean;
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const request: CreateHomeworkSessionRequest = {
        learnerId,
        title,
        ...options
      };
      
      const data = await apiRequest<CreateHomeworkSessionResponse>(
        `${API_BASE}/sessions`,
        {
          method: "POST",
          body: JSON.stringify(request)
        }
      );
      
      setSessions(prev => [data.session, ...prev]);
      return data.session;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
      return null;
    } finally {
      setLoading(false);
    }
  }, [learnerId]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession
  };
}

// ============================================================================
// Active Session Hook
// ============================================================================

export function useHomeworkSession(sessionId: string | null) {
  const [session, setSession] = useState<HomeworkSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return null;
    
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ session: HomeworkSession }>(
        `${API_BASE}/sessions/${sessionId}`
      );
      setSession(data.session);
      return data.session;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch session");
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const updateSession = useCallback(async (
    updates: Partial<{
      status: HomeworkSessionStatus;
      difficultyMode: HomeworkDifficultyMode;
      parentAssistMode: boolean;
    }>
  ) => {
    if (!sessionId) return null;
    
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ session: HomeworkSession }>(
        `${API_BASE}/sessions/${sessionId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updates)
        }
      );
      setSession(data.session);
      return data.session;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update session");
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  return {
    session,
    loading,
    error,
    fetchSession,
    updateSession,
    setSession
  };
}

// ============================================================================
// File Upload Hook
// ============================================================================

export function useHomeworkUpload(sessionId: string) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (
    file: File,
    inputType: "UPLOAD" | "CAMERA" | "DOCUMENT" = "UPLOAD"
  ): Promise<UploadHomeworkFileResponse | null> => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("inputType", inputType);

      // Use XMLHttpRequest for progress tracking
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || "Upload failed"));
            } catch {
              reject(new Error("Upload failed"));
            }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

        xhr.open("POST", `${API_BASE}/sessions/${sessionId}/upload`);
        xhr.send(formData);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  }, [sessionId]);

  const submitText = useCallback(async (
    text: string
  ): Promise<SubmitTextInputResponse | null> => {
    setUploading(true);
    setError(null);
    
    try {
      const data = await apiRequest<SubmitTextInputResponse>(
        `${API_BASE}/sessions/${sessionId}/text`,
        {
          method: "POST",
          body: JSON.stringify({ sessionId, text })
        }
      );
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit text");
      return null;
    } finally {
      setUploading(false);
    }
  }, [sessionId]);

  return {
    uploading,
    uploadProgress,
    error,
    uploadFile,
    submitText
  };
}

// ============================================================================
// Hint System Hook
// ============================================================================

export function useHomeworkHints(sessionId: string) {
  const [hints, setHints] = useState<HomeworkHint[]>([]);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestHint = useCallback(async (
    step: HomeworkSessionStatus,
    hintType?: HomeworkHintType,
    context?: string
  ): Promise<RequestHintResponse | null> => {
    setRequesting(true);
    setError(null);
    
    try {
      const data = await apiRequest<RequestHintResponse>(
        `${API_BASE}/sessions/${sessionId}/hint`,
        {
          method: "POST",
          body: JSON.stringify({ sessionId, step, hintType, context })
        }
      );
      
      setHints(prev => [...prev, data.hint]);
      setHintsRemaining(data.hintsRemaining);
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get hint";
      setError(message);
      
      // Check for max hints reached
      if (message.includes("Maximum hints")) {
        setHintsRemaining(0);
      }
      
      return null;
    } finally {
      setRequesting(false);
    }
  }, [sessionId]);

  const markHelpful = useCallback(async (
    hintId: string,
    wasHelpful: boolean
  ) => {
    try {
      await apiRequest(
        `${API_BASE}/hints/${hintId}/helpful`,
        {
          method: "POST",
          body: JSON.stringify({ hintId, wasHelpful })
        }
      );
      
      setHints(prev => 
        prev.map(h => 
          h.id === hintId ? { ...h, wasHelpful } : h
        )
      );
    } catch {
      // Silently fail - this is not critical
    }
  }, []);

  const resetHints = useCallback((newRemaining: number = 3) => {
    setHints([]);
    setHintsRemaining(newRemaining);
    setError(null);
  }, []);

  return {
    hints,
    hintsRemaining,
    requesting,
    error,
    requestHint,
    markHelpful,
    resetHints
  };
}

// ============================================================================
// Step Progress Hook
// ============================================================================

export function useHomeworkSteps(sessionId: string) {
  const [currentStep, setCurrentStep] = useState<HomeworkSessionStatus>("UNDERSTAND");
  const [guidance, setGuidance] = useState<SolutionPlan | SolutionStep[] | VerificationResult | null>(null);
  const [progressing, setProgressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressToNextStep = useCallback(async (
    inputData?: Record<string, unknown>
  ): Promise<ProgressStepResponse | null> => {
    setProgressing(true);
    setError(null);
    
    try {
      const data = await apiRequest<ProgressStepResponse>(
        `${API_BASE}/sessions/${sessionId}/step`,
        {
          method: "POST",
          body: JSON.stringify({
            sessionId,
            currentStep,
            inputData
          })
        }
      );
      
      setCurrentStep(data.session.status);
      setGuidance(data.nextStepGuidance ?? null);
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to progress step");
      return null;
    } finally {
      setProgressing(false);
    }
  }, [sessionId, currentStep]);

  const setStep = useCallback((step: HomeworkSessionStatus) => {
    setCurrentStep(step);
  }, []);

  return {
    currentStep,
    guidance,
    progressing,
    error,
    progressToNextStep,
    setStep,
    setGuidance
  };
}

// ============================================================================
// Solution Check Hook
// ============================================================================

export function useHomeworkCheck(sessionId: string) {
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSolution = useCallback(async (
    solution: string | Record<string, unknown>,
    showWork?: string
  ): Promise<CheckSolutionResponse | null> => {
    setChecking(true);
    setError(null);
    
    try {
      const data = await apiRequest<CheckSolutionResponse>(
        `${API_BASE}/sessions/${sessionId}/check`,
        {
          method: "POST",
          body: JSON.stringify({ sessionId, solution, showWork })
        }
      );
      
      setVerification(data.verification);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check solution");
      return null;
    } finally {
      setChecking(false);
    }
  }, [sessionId]);

  const resetVerification = useCallback(() => {
    setVerification(null);
    setError(null);
  }, []);

  return {
    verification,
    checking,
    error,
    checkSolution,
    resetVerification
  };
}

// ============================================================================
// Combined Homework Helper Hook
// ============================================================================

export interface UseHomeworkHelperOptions {
  learnerId: string;
  sessionId?: string;
  onSessionCreated?: (session: HomeworkSession) => void;
  onStepProgress?: (step: HomeworkSessionStatus) => void;
  onComplete?: (session: HomeworkSession) => void;
}

export function useHomeworkHelper(options: UseHomeworkHelperOptions) {
  const { learnerId, sessionId: initialSessionId, onSessionCreated, onStepProgress, onComplete } = options;
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId ?? null);
  const [analysis, setAnalysis] = useState<ProblemAnalysis | null>(null);
  
  const sessions = useHomeworkSessions(learnerId);
  const activeSession = useHomeworkSession(activeSessionId);
  const upload = useHomeworkUpload(activeSessionId ?? "");
  const hints = useHomeworkHints(activeSessionId ?? "");
  const steps = useHomeworkSteps(activeSessionId ?? "");
  const check = useHomeworkCheck(activeSessionId ?? "");

  const startNewSession = useCallback(async (
    title: string,
    options?: Parameters<typeof sessions.createSession>[1]
  ) => {
    const session = await sessions.createSession(title, options);
    if (session) {
      setActiveSessionId(session.id);
      steps.setStep("UNDERSTAND");
      hints.resetHints(session.maxHintsPerStep);
      onSessionCreated?.(session);
    }
    return session;
  }, [sessions, steps, hints, onSessionCreated]);

  const resumeSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    const session = await activeSession.fetchSession();
    if (session) {
      steps.setStep(session.status);
      hints.resetHints(session.maxHintsPerStep - session.currentStepHints);
    }
    return session;
  }, [activeSession, steps, hints]);

  const submitProblem = useCallback(async (input: string | File) => {
    if (!activeSessionId) return null;
    
    let result;
    if (typeof input === "string") {
      result = await upload.submitText(input);
    } else {
      result = await upload.uploadFile(input);
    }
    
    if (result && "analysis" in result && result.analysis) {
      setAnalysis(result.analysis);
    }
    
    return result;
  }, [activeSessionId, upload]);

  const advanceStep = useCallback(async (inputData?: Record<string, unknown>) => {
    const result = await steps.progressToNextStep(inputData);
    if (result) {
      onStepProgress?.(result.session.status);
      hints.resetHints();
      
      if (result.session.status === "COMPLETE") {
        onComplete?.(result.session);
      }
    }
    return result;
  }, [steps, hints, onStepProgress, onComplete]);

  const submitSolution = useCallback(async (
    solution: string | Record<string, unknown>,
    showWork?: string
  ) => {
    const result = await check.checkSolution(solution, showWork);
    if (result?.session.status === "COMPLETE") {
      onComplete?.(result.session);
    }
    return result;
  }, [check, onComplete]);

  return {
    // State
    learnerId,
    activeSessionId,
    analysis,
    
    // Session management
    sessions: sessions.sessions,
    sessionsLoading: sessions.loading,
    sessionsError: sessions.error,
    fetchSessions: sessions.fetchSessions,
    startNewSession,
    resumeSession,
    
    // Active session
    session: activeSession.session,
    sessionLoading: activeSession.loading,
    sessionError: activeSession.error,
    updateSession: activeSession.updateSession,
    
    // Problem input
    submitProblem,
    uploading: upload.uploading,
    uploadProgress: upload.uploadProgress,
    uploadError: upload.error,
    
    // Step management
    currentStep: steps.currentStep,
    guidance: steps.guidance,
    advanceStep,
    progressing: steps.progressing,
    stepError: steps.error,
    
    // Hints
    hints: hints.hints,
    hintsRemaining: hints.hintsRemaining,
    requestHint: hints.requestHint,
    hintLoading: hints.requesting,
    hintError: hints.error,
    
    // Solution check
    verification: check.verification,
    submitSolution,
    checking: check.checking,
    checkError: check.error
  };
}

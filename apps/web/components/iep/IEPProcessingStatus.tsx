"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, FileSearch, AlertTriangle, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ProcessingStatus =
  | "PENDING"
  | "SCANNING"
  | "OCR_PROCESSING"
  | "EXTRACTING"
  | "VALIDATING"
  | "EXTRACTED"
  | "FAILED"
  | "REVIEWED";

interface ProcessingStep {
  status: ProcessingStatus;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PROCESSING_STEPS: ProcessingStep[] = [
  {
    status: "PENDING",
    label: "Queued",
    description: "Document is queued for processing",
    icon: Clock,
  },
  {
    status: "SCANNING",
    label: "Security Scan",
    description: "Scanning document for security threats",
    icon: FileSearch,
  },
  {
    status: "OCR_PROCESSING",
    label: "Text Extraction",
    description: "Extracting text from PDF using OCR",
    icon: FileSearch,
  },
  {
    status: "EXTRACTING",
    label: "AI Analysis",
    description: "AI is extracting goals, services, and accommodations",
    icon: Loader2,
  },
  {
    status: "VALIDATING",
    label: "Validation",
    description: "Validating extracted data against SMART criteria",
    icon: CheckCircle2,
  },
];

interface StatusResponse {
  document_id: string;
  status: ProcessingStatus;
  filename: string;
  uploaded_at: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  error_message?: string;
  extracted_counts?: {
    goals: number;
    services: number;
    accommodations: number;
    present_levels: number;
  };
}

interface IEPProcessingStatusProps {
  documentId: string;
  initialStatus?: StatusResponse;
  onComplete?: (status: StatusResponse) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function IEPProcessingStatus({
  documentId,
  initialStatus,
  onComplete,
  onError,
  className,
}: IEPProcessingStatusProps) {
  const [status, setStatus] = useState<StatusResponse | null>(initialStatus || null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!isPolling) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/iep/documents/${documentId}/status`);
        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }
        const data: StatusResponse = await response.json();
        setStatus(data);

        if (data.status === "EXTRACTED" || data.status === "REVIEWED") {
          setIsPolling(false);
          onComplete?.(data);
        } else if (data.status === "FAILED") {
          setIsPolling(false);
          onError?.(data.error_message || "Processing failed");
        }
      } catch (error) {
        console.error("Error fetching status:", error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, [documentId, isPolling, onComplete, onError]);

  const getCurrentStepIndex = () => {
    if (!status) return 0;
    const index = PROCESSING_STEPS.findIndex((s) => s.status === status.status);
    return index >= 0 ? index : PROCESSING_STEPS.length;
  };

  const getOverallProgress = () => {
    if (!status) return 0;
    if (status.status === "EXTRACTED" || status.status === "REVIEWED") return 100;
    if (status.status === "FAILED") return 0;

    const currentIndex = getCurrentStepIndex();
    return Math.round((currentIndex / PROCESSING_STEPS.length) * 100);
  };

  const isComplete = status?.status === "EXTRACTED" || status?.status === "REVIEWED";
  const isFailed = status?.status === "FAILED";

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Processing Status</h3>
          {status?.filename && (
            <p className="text-sm text-muted-foreground">{status.filename}</p>
          )}
        </div>
        {isComplete && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Complete</span>
          </div>
        )}
        {isFailed && (
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Failed</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress
          value={getOverallProgress()}
          className={cn("h-2", isFailed && "bg-destructive/20")}
        />
        <p className="text-sm text-muted-foreground text-right">
          {getOverallProgress()}% complete
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {PROCESSING_STEPS.map((step, index) => {
          const currentIndex = getCurrentStepIndex();
          const isActive = index === currentIndex && !isComplete && !isFailed;
          const isCompleted = index < currentIndex || isComplete;
          const isPending = index > currentIndex;

          const Icon = step.icon;

          return (
            <div
              key={step.status}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                isActive && "bg-primary/10 border border-primary/20",
                isCompleted && "bg-green-50 dark:bg-green-950/20",
                isPending && "opacity-50"
              )}
            >
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "bg-green-600 text-white",
                  isPending && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium text-sm",
                    isActive && "text-primary",
                    isCompleted && "text-green-700 dark:text-green-400"
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {isActive && (
                <div className="text-xs text-primary font-medium">In Progress</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {isFailed && status?.error_message && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Processing Failed</p>
            <p className="text-sm text-destructive/80 mt-1">{status.error_message}</p>
          </div>
        </div>
      )}

      {/* Extraction summary */}
      {isComplete && status?.extracted_counts && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {status.extracted_counts.goals}
            </p>
            <p className="text-xs text-muted-foreground">Goals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {status.extracted_counts.services}
            </p>
            <p className="text-xs text-muted-foreground">Services</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {status.extracted_counts.accommodations}
            </p>
            <p className="text-xs text-muted-foreground">Accommodations</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {status.extracted_counts.present_levels}
            </p>
            <p className="text-xs text-muted-foreground">Present Levels</p>
          </div>
        </div>
      )}

      {/* Timestamps */}
      {status && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Uploaded: {new Date(status.uploaded_at).toLocaleString()}</p>
          {status.processing_started_at && (
            <p>Started: {new Date(status.processing_started_at).toLocaleString()}</p>
          )}
          {status.processing_completed_at && (
            <p>Completed: {new Date(status.processing_completed_at).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
}

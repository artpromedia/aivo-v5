"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";

interface SMARTAnalysis {
  specific: { is_met: boolean; explanation: string; suggestion?: string };
  measurable: { is_met: boolean; explanation: string; suggestion?: string };
  achievable: { is_met: boolean; explanation: string; suggestion?: string };
  relevant: { is_met: boolean; explanation: string; suggestion?: string };
  time_bound: { is_met: boolean; explanation: string; suggestion?: string };
  overall_score: number;
  improved_goal?: string;
  warnings?: string[];
}

interface SMARTGoalValidatorProps {
  goalText: string;
  baseline?: string;
  onGoalChange?: (newGoal: string) => void;
  onValidationComplete?: (analysis: SMARTAnalysis) => void;
  showEditor?: boolean;
  className?: string;
}

export function SMARTGoalValidator({
  goalText,
  baseline,
  onGoalChange,
  onValidationComplete,
  showEditor = false,
  className,
}: SMARTGoalValidatorProps) {
  const [analysis, setAnalysis] = useState<SMARTAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editedGoal, setEditedGoal] = useState(goalText);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setEditedGoal(goalText);
  }, [goalText]);

  const validateGoal = async (textToValidate: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/iep/goals/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_text: textToValidate,
          baseline,
          use_ai: true,
        }),
      });

      if (!response.ok) throw new Error("Validation failed");

      const data: SMARTAnalysis = await response.json();
      setAnalysis(data);
      onValidationComplete?.(data);
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (goalText) {
      validateGoal(goalText);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRevalidate = () => {
    validateGoal(editedGoal);
  };

  const useImprovedGoal = () => {
    if (analysis?.improved_goal) {
      setEditedGoal(analysis.improved_goal);
      onGoalChange?.(analysis.improved_goal);
      validateGoal(analysis.improved_goal);
    }
  };

  const criteriaEntries = analysis
    ? [
        { key: "specific", label: "Specific", ...analysis.specific },
        { key: "measurable", label: "Measurable", ...analysis.measurable },
        { key: "achievable", label: "Achievable", ...analysis.achievable },
        { key: "relevant", label: "Relevant", ...analysis.relevant },
        { key: "time_bound", label: "Time-Bound", ...analysis.time_bound },
      ]
    : [];

  const metCount = criteriaEntries.filter((c) => c.is_met).length;
  const overallScore = analysis?.overall_score || 0;
  const isCompliant = metCount >= 4 && overallScore >= 70;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          SMART Criteria Analysis
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRevalidate}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          {isLoading ? "Analyzing..." : "Re-analyze"}
        </Button>
      </div>

      {/* Goal editor (optional) */}
      {showEditor && (
        <div className="space-y-2">
          <Textarea
            value={editedGoal}
            onChange={(e) => {
              setEditedGoal(e.target.value);
              onGoalChange?.(e.target.value);
            }}
            className="min-h-[80px]"
            placeholder="Enter goal text..."
          />
        </div>
      )}

      {/* Overall score */}
      {analysis && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall SMART Score</span>
            <span
              className={cn(
                "font-medium",
                isCompliant ? "text-green-600" : overallScore >= 50 ? "text-yellow-600" : "text-red-600"
              )}
            >
              {Math.round(overallScore)}%
            </span>
          </div>
          <Progress
            value={overallScore}
            className={cn(
              "h-2",
              isCompliant ? "[&>div]:bg-green-600" : overallScore >= 50 ? "[&>div]:bg-yellow-600" : "[&>div]:bg-red-600"
            )}
          />
          <div className="flex items-center gap-2">
            {isCompliant ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                SMART Compliant
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {metCount}/5 Criteria Met
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Criteria breakdown */}
      {analysis && (
        <div className="space-y-2">
          {criteriaEntries.map((criterion) => (
            <div
              key={criterion.key}
              className={cn(
                "p-3 rounded-lg border transition-colors",
                criterion.is_met
                  ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                  : "border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {criterion.is_met ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{criterion.label}</span>
                    <Badge variant={criterion.is_met ? "success" : "warning"} className="text-xs">
                      {criterion.is_met ? "Met" : "Not Met"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{criterion.explanation}</p>
                  {!criterion.is_met && criterion.suggestion && (
                    <p className="text-sm text-primary mt-1 flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {criterion.suggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {analysis?.warnings && analysis.warnings.length > 0 && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h5 className="font-medium text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            Warnings
          </h5>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            {analysis.warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2">
                <span>•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improved goal suggestion */}
      {analysis?.improved_goal && !isCompliant && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {showSuggestions ? "Hide" : "Show"} AI-Suggested Improvement
          </Button>

          {showSuggestions && (
            <div className="p-4 bg-primary/5 rounded-lg space-y-3">
              <h5 className="font-medium text-sm">Suggested SMART Goal:</h5>
              <p className="text-sm border-l-2 border-primary pl-3">{analysis.improved_goal}</p>
              <Button size="sm" onClick={useImprovedGoal} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Use This Version
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

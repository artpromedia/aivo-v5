"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Circle, AlertTriangle, Hand, Eye, MessageSquare, Pointer } from "lucide-react";

// Types
interface TaskStep {
  stepNumber: number;
  description: string;
  promptHierarchy: string[];
  criticalStep?: boolean;
  notes?: string;
}

interface StepProgress {
  stepNumber: number;
  masteryLevel: string;
  lastPromptLevel?: string;
  trialsCorrect?: number;
  trialsTotal?: number;
}

interface TaskAnalysisViewerProps {
  skillName: string;
  skillDescription: string;
  steps: TaskStep[];
  stepProgress?: StepProgress[];
  onStepClick?: (stepNumber: number) => void;
  showPromptLevels?: boolean;
}

const promptIcons: Record<string, React.ReactNode> = {
  FULL_PHYSICAL: <Hand className="h-4 w-4" />,
  PARTIAL_PHYSICAL: <Hand className="h-4 w-4 opacity-60" />,
  MODELING: <Eye className="h-4 w-4" />,
  GESTURAL: <Pointer className="h-4 w-4" />,
  VERBAL_DIRECT: <MessageSquare className="h-4 w-4" />,
  VERBAL_INDIRECT: <MessageSquare className="h-4 w-4 opacity-60" />,
  VISUAL: <Eye className="h-4 w-4 opacity-60" />,
  INDEPENDENT: <CheckCircle2 className="h-4 w-4 text-green-500" />,
};

const promptLabels: Record<string, string> = {
  FULL_PHYSICAL: "Full Physical",
  PARTIAL_PHYSICAL: "Partial Physical",
  MODELING: "Modeling",
  GESTURAL: "Gestural",
  VERBAL_DIRECT: "Verbal Direct",
  VERBAL_INDIRECT: "Verbal Indirect",
  VISUAL: "Visual",
  INDEPENDENT: "Independent",
};

const masteryLevelColors: Record<string, string> = {
  NOT_INTRODUCED: "bg-gray-100 border-gray-300",
  EMERGING: "bg-yellow-50 border-yellow-300",
  DEVELOPING: "bg-orange-50 border-orange-300",
  PRACTICING: "bg-blue-50 border-blue-300",
  INDEPENDENT: "bg-green-50 border-green-300",
  MASTERED: "bg-green-100 border-green-400",
};

export function TaskAnalysisViewer({
  skillName,
  skillDescription,
  steps,
  stepProgress = [],
  onStepClick,
  showPromptLevels = true,
}: TaskAnalysisViewerProps) {
  // Create a map for quick progress lookup
  const progressMap = stepProgress.reduce((acc, p) => {
    acc[p.stepNumber] = p;
    return acc;
  }, {} as Record<number, StepProgress>);

  const totalSteps = steps.length;
  const completedSteps = stepProgress.filter(
    (p) => p.masteryLevel === "MASTERED" || p.masteryLevel === "INDEPENDENT"
  ).length;
  const overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{skillName}</h3>
            <p className="text-sm text-muted-foreground mt-1">{skillDescription}</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {totalSteps} Steps
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Task Completion</span>
            <span className="font-medium">{completedSteps}/{totalSteps} steps mastered</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => {
            const progress = progressMap[step.stepNumber];
            const isCompleted = progress?.masteryLevel === "MASTERED" || progress?.masteryLevel === "INDEPENDENT";
            const bgColor = progress ? masteryLevelColors[progress.masteryLevel] : "bg-white";

            return (
              <div
                key={step.stepNumber}
                onClick={() => onStepClick?.(step.stepNumber)}
                className={`
                  p-4 border rounded-lg transition-all
                  ${bgColor}
                  ${onStepClick ? "cursor-pointer hover:shadow-md" : ""}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Step Number & Status */}
                  <div className="flex flex-col items-center gap-1">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}
                    `}>
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step.stepNumber}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-0.5 h-8 ${isCompleted ? "bg-green-300" : "bg-gray-200"}`} />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{step.description}</p>
                      {step.criticalStep && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>

                    {/* Progress Info */}
                    {progress && (
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {progress.masteryLevel.replace(/_/g, " ")}
                        </Badge>
                        {progress.lastPromptLevel && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            {promptIcons[progress.lastPromptLevel]}
                            {promptLabels[progress.lastPromptLevel]}
                          </span>
                        )}
                        {progress.trialsTotal !== undefined && progress.trialsTotal > 0 && (
                          <span className="text-muted-foreground">
                            {progress.trialsCorrect}/{progress.trialsTotal} trials
                          </span>
                        )}
                      </div>
                    )}

                    {/* Step Notes */}
                    {step.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        💡 {step.notes}
                      </p>
                    )}

                    {/* Prompt Hierarchy */}
                    {showPromptLevels && step.promptHierarchy && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {step.promptHierarchy.map((prompt, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-muted-foreground"
                            title={promptLabels[prompt]}
                          >
                            {promptIcons[prompt]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">Prompt Level Legend</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(promptLabels).map(([key, label]) => (
              <span key={key} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {promptIcons[key]}
                {label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskAnalysisViewer;

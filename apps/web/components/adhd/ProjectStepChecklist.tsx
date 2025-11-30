"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProjectStep {
  id: string;
  stepNumber: number;
  title: string;
  description?: string;
  estimatedMinutes: number;
  suggestedDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
}

interface ProjectStepChecklistProps {
  steps: ProjectStep[];
  onToggleComplete: (stepId: string, completed: boolean) => Promise<void>;
  showDates?: boolean;
  showProgress?: boolean;
  compact?: boolean;
  className?: string;
}

export function ProjectStepChecklist({
  steps,
  onToggleComplete,
  showDates = true,
  showProgress = true,
  compact = false,
  className,
}: ProjectStepChecklistProps) {
  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
  const totalMinutes = steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
  const completedMinutes = steps
    .filter((s) => s.isCompleted)
    .reduce((sum, s) => sum + s.estimatedMinutes, 0);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {completedCount} of {steps.length} steps complete
            </span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              <Clock className="h-3 w-3 inline mr-1" />
              {completedMinutes}/{totalMinutes} min
            </span>
            {progressPercent === 100 && (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                All done!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className={cn("space-y-2", compact && "space-y-1")}>
        {steps.map((step, index) => (
          <StepItem
            key={step.id}
            step={step}
            onToggle={(completed) => onToggleComplete(step.id, completed)}
            showDate={showDates}
            compact={compact}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

interface StepItemProps {
  step: ProjectStep;
  onToggle: (completed: boolean) => void;
  showDate: boolean;
  compact: boolean;
  isLast: boolean;
}

function StepItem({ step, onToggle, showDate, compact, isLast }: StepItemProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      await onToggle(checked);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="relative">
      {/* Connection Line */}
      {!isLast && !compact && (
        <div
          className={cn(
            "absolute left-[1.125rem] top-8 w-0.5 h-[calc(100%-1rem)]",
            step.isCompleted ? "bg-green-300" : "bg-gray-200"
          )}
        />
      )}

      <div
        className={cn(
          "flex items-start gap-3 p-2 rounded-lg transition-all",
          step.isCompleted
            ? "bg-green-50 dark:bg-green-900/20"
            : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
          compact && "p-1"
        )}
      >
        {/* Checkbox with Step Number */}
        <div className="relative">
          <Checkbox
            checked={step.isCompleted}
            disabled={isToggling}
            onCheckedChange={handleToggle}
            className={cn(
              "h-6 w-6 rounded-full border-2",
              step.isCompleted && "bg-green-500 border-green-500"
            )}
          />
          {!step.isCompleted && (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium pointer-events-none">
              {step.stepNumber}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "font-medium",
                step.isCompleted && "line-through text-gray-500",
                compact && "text-sm"
              )}
            >
              {step.title}
            </h4>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge
                variant="outline"
                className={cn("text-xs", compact && "text-[10px] px-1.5 py-0")}
              >
                <Clock className="h-3 w-3 mr-1" />
                {step.estimatedMinutes}m
              </Badge>
            </div>
          </div>

          {!compact && step.description && (
            <p className="text-sm text-gray-500 mt-1">{step.description}</p>
          )}

          {!compact && (
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {showDate && step.suggestedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(step.suggestedDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
              {step.completedAt && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed{" "}
                  {new Date(step.completedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  AlertCircle,
  Brain,
  Check,
  Clock,
  X,
  ThumbsUp,
  ThumbsDown,
  Meh,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SelfMonitoringCheckType =
  | "ATTENTION"
  | "ON_TASK"
  | "UNDERSTANDING"
  | "EMOTION"
  | "ENERGY";

export interface SelfMonitoringLog {
  id: string;
  learnerId: string;
  timestamp: string;
  checkType: SelfMonitoringCheckType;
  response: number; // 1-5 or specific values
  context?: string;
  activityType?: string;
}

interface SelfMonitoringPromptProps {
  isOpen: boolean;
  checkType: SelfMonitoringCheckType;
  activityContext?: string;
  onSubmit: (response: number, notes?: string) => Promise<void>;
  onDismiss: () => void;
  autoHideDelay?: number; // ms
  className?: string;
}

const checkTypeConfig: Record<
  SelfMonitoringCheckType,
  {
    title: string;
    question: string;
    icon: typeof Brain;
    color: string;
    options: { value: number; label: string; emoji: string }[];
  }
> = {
  ATTENTION: {
    title: "Attention Check",
    question: "How focused are you right now?",
    icon: Brain,
    color: "bg-theme-primary",
    options: [
      { value: 1, label: "Very distracted", emoji: "😵" },
      { value: 2, label: "Somewhat distracted", emoji: "😕" },
      { value: 3, label: "Neutral", emoji: "😐" },
      { value: 4, label: "Mostly focused", emoji: "🙂" },
      { value: 5, label: "Very focused", emoji: "🎯" },
    ],
  },
  ON_TASK: {
    title: "Task Check",
    question: "Are you working on what you should be?",
    icon: Check,
    color: "bg-blue-500",
    options: [
      { value: 1, label: "Not at all", emoji: "❌" },
      { value: 2, label: "Got sidetracked", emoji: "🔀" },
      { value: 3, label: "Partly", emoji: "⚖️" },
      { value: 4, label: "Mostly", emoji: "✅" },
      { value: 5, label: "Completely", emoji: "🎯" },
    ],
  },
  UNDERSTANDING: {
    title: "Understanding Check",
    question: "How well do you understand the material?",
    icon: AlertCircle,
    color: "bg-green-500",
    options: [
      { value: 1, label: "Very confused", emoji: "😵‍💫" },
      { value: 2, label: "Somewhat confused", emoji: "🤔" },
      { value: 3, label: "Getting there", emoji: "💭" },
      { value: 4, label: "Mostly understand", emoji: "💡" },
      { value: 5, label: "Fully understand", emoji: "🌟" },
    ],
  },
  EMOTION: {
    title: "Emotion Check",
    question: "How are you feeling right now?",
    icon: AlertCircle,
    color: "bg-pink-500",
    options: [
      { value: 1, label: "Frustrated", emoji: "😤" },
      { value: 2, label: "Anxious", emoji: "😰" },
      { value: 3, label: "Okay", emoji: "😐" },
      { value: 4, label: "Good", emoji: "🙂" },
      { value: 5, label: "Great", emoji: "😊" },
    ],
  },
  ENERGY: {
    title: "Energy Check",
    question: "What's your energy level?",
    icon: Clock,
    color: "bg-orange-500",
    options: [
      { value: 1, label: "Very tired", emoji: "😴" },
      { value: 2, label: "Low energy", emoji: "🥱" },
      { value: 3, label: "Moderate", emoji: "😐" },
      { value: 4, label: "Good energy", emoji: "⚡" },
      { value: 5, label: "High energy", emoji: "🔥" },
    ],
  },
};

export function SelfMonitoringPrompt({
  isOpen,
  checkType,
  activityContext,
  onSubmit,
  onDismiss,
  autoHideDelay = 30000,
  className,
}: SelfMonitoringPromptProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const config = checkTypeConfig[checkType];
  const Icon = config.icon;

  // Auto-dismiss timer
  useEffect(() => {
    if (!isOpen || autoHideDelay <= 0) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, autoHideDelay);

    return () => clearTimeout(timer);
  }, [isOpen, autoHideDelay, onDismiss]);

  const handleSubmit = async () => {
    if (selectedValue === null) return;
    setIsSubmitting(true);
    try {
      await onSubmit(selectedValue);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedValue(null);
        onDismiss();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Success state
  if (showSuccess) {
    return (
      <div
        className={cn(
          "fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4",
          className
        )}
      >
        <div className="bg-green-500 text-white rounded-lg p-4 shadow-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span className="font-medium">Response recorded!</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300",
        className
      )}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border w-80 overflow-hidden">
        {/* Header */}
        <div className={cn("p-3 text-white flex items-center justify-between", config.color)}>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <span className="font-medium">{config.title}</span>
          </div>
          <button
            onClick={onDismiss}
            className="hover:bg-white/20 rounded p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="font-medium mb-1">{config.question}</p>
          {activityContext && (
            <p className="text-sm text-gray-500 mb-3">
              During: {activityContext}
            </p>
          )}

          {/* Options */}
          <div className="space-y-2">
            {config.options.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedValue(option.value)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg border transition-all",
                  selectedValue === option.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-sm font-medium flex-1 text-left">
                  {option.label}
                </span>
                {selectedValue === option.value && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={selectedValue === null || isSubmitting}
            className="w-full mt-4"
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </Button>
        </div>

        {/* Timer indicator */}
        {autoHideDelay > 0 && (
          <div className="h-1 bg-gray-200">
            <div
              className={cn("h-full transition-all", config.color)}
              style={{
                animation: `shrink ${autoHideDelay}ms linear forwards`,
              }}
            />
          </div>
        )}

        <style jsx>{`
          @keyframes shrink {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

// Quick Response Version for inline use
interface QuickSelfMonitoringProps {
  checkType: SelfMonitoringCheckType;
  onSubmit: (response: number) => Promise<void>;
  compact?: boolean;
  className?: string;
}

export function QuickSelfMonitoring({
  checkType,
  onSubmit,
  compact = false,
  className,
}: QuickSelfMonitoringProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const config = checkTypeConfig[checkType];

  const handleSubmit = async (value: number) => {
    setIsSubmitting(true);
    try {
      await onSubmit(value);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={cn("flex items-center gap-2 text-green-600", className)}>
        <Check className="h-4 w-4" />
        <span className="text-sm">Recorded!</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className="text-sm text-gray-500 mr-2">{config.title}:</span>
        {config.options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSubmit(option.value)}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={option.label}
          >
            <span className="text-lg">{option.emoji}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium">{config.question}</p>
      <div className="flex items-center gap-2">
        {config.options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSubmit(option.value)}
            disabled={isSubmitting}
            className="flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={option.label}
          >
            <span className="text-2xl">{option.emoji}</span>
            <span className="text-xs text-gray-500 mt-1">{option.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Hook for managing self-monitoring intervals
export function useSelfMonitoringSchedule(
  intervalMinutes: number,
  onTrigger: (checkType: SelfMonitoringCheckType) => void,
  enabled: boolean = true
) {
  const [lastPrompt, setLastPrompt] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled || intervalMinutes <= 0) return;

    const checkTypes: SelfMonitoringCheckType[] = [
      "ATTENTION",
      "ON_TASK",
      "UNDERSTANDING",
      "EMOTION",
      "ENERGY",
    ];

    const interval = setInterval(() => {
      // Randomly select a check type
      const randomType = checkTypes[Math.floor(Math.random() * checkTypes.length)];
      onTrigger(randomType);
      setLastPrompt(new Date());
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [intervalMinutes, onTrigger, enabled]);

  return { lastPrompt };
}

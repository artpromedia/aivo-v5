"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

interface SMARTCriteria {
  specific: boolean;
  measurable: boolean;
  achievable: boolean;
  relevant: boolean;
  time_bound: boolean;
  overall_score: number;
}

interface ExtractedGoal {
  id: string;
  goal_text: string;
  domain: string;
  baseline?: string;
  target_criteria?: string;
  timeframe?: string;
  confidence_score: number;
  smart_analysis?: SMARTCriteria;
  ai_suggestions?: string[];
  improved_goal?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  page_number?: number;
}

interface ExtractedGoalCardProps {
  goal: ExtractedGoal;
  onVerify: (goalId: string, goalText: string) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
  onEdit: (goalId: string, goalText: string) => Promise<void>;
  className?: string;
}

export function ExtractedGoalCard({
  goal,
  onVerify,
  onDelete,
  onEdit,
  className,
}: ExtractedGoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(goal.goal_text);
  const [isLoading, setIsLoading] = useState(false);
  const [showImproved, setShowImproved] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      await onVerify(goal.id, editedText);
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this extracted goal?")) return;
    setIsLoading(true);
    try {
      await onDelete(goal.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (editedText === goal.goal_text) {
      setIsEditing(false);
      return;
    }
    setIsLoading(true);
    try {
      await onEdit(goal.id, editedText);
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const useImprovedGoal = () => {
    if (goal.improved_goal) {
      setEditedText(goal.improved_goal);
      setShowImproved(false);
      setIsEditing(true);
    }
  };

  const getConfidenceBadge = () => {
    if (goal.confidence_score >= 0.9) {
      return <Badge variant="success">High Confidence</Badge>;
    } else if (goal.confidence_score >= 0.7) {
      return <Badge variant="warning">Medium Confidence</Badge>;
    } else {
      return <Badge variant="destructive">Low Confidence</Badge>;
    }
  };

  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      ACADEMIC_READING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      ACADEMIC_MATH: "bg-theme-primary/10 text-theme-primary dark:bg-theme-primary/20 dark:text-theme-primary",
      ACADEMIC_WRITING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      COMMUNICATION: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      SOCIAL_EMOTIONAL: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      ADAPTIVE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      MOTOR: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      TRANSITION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      COGNITIVE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      SENSORY: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
    };
    return colors[domain] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const formatDomain = (domain: string) => {
    return domain
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const smartScore = goal.smart_analysis?.overall_score || 0;
  const smartMet = goal.smart_analysis
    ? Object.entries(goal.smart_analysis)
        .filter(([key]) => key !== "overall_score")
        .filter(([, value]) => value === true).length
    : 0;

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-all",
        goal.is_verified
          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
          : "border-border",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge className={getDomainColor(goal.domain)}>{formatDomain(goal.domain)}</Badge>
            {getConfidenceBadge()}
            {goal.is_verified && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            )}
            {goal.page_number && (
              <span className="text-xs text-muted-foreground">Page {goal.page_number}</span>
            )}
          </div>

          {isEditing ? (
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[100px]"
              disabled={isLoading}
            />
          ) : (
            <p className="text-sm">{goal.goal_text}</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!goal.is_verified && (
            <>
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditedText(goal.goal_text);
                      setIsEditing(false);
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleEdit} disabled={isLoading}>
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    title="Edit goal"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    disabled={isLoading}
                    title="Delete goal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t pt-4">
          {/* Goal details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {goal.baseline && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Baseline</p>
                <p className="text-sm">{goal.baseline}</p>
              </div>
            )}
            {goal.target_criteria && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Target</p>
                <p className="text-sm">{goal.target_criteria}</p>
              </div>
            )}
            {goal.timeframe && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Timeframe</p>
                <p className="text-sm">{goal.timeframe}</p>
              </div>
            )}
          </div>

          {/* SMART Analysis */}
          {goal.smart_analysis && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">SMART Criteria</p>
                <span
                  className={cn(
                    "text-xs font-medium",
                    smartScore >= 70 ? "text-green-600" : smartScore >= 50 ? "text-yellow-600" : "text-red-600"
                  )}
                >
                  {smartMet}/5 met ({Math.round(smartScore)}%)
                </span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {Object.entries(goal.smart_analysis)
                  .filter(([key]) => key !== "overall_score")
                  .map(([key, value]) => (
                    <Badge
                      key={key}
                      variant={value ? "success" : "secondary"}
                      className="text-xs"
                    >
                      {value ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                      {key.charAt(0).toUpperCase()}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {goal.ai_suggestions && goal.ai_suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Suggestions
              </p>
              <ul className="text-sm space-y-1">
                {goal.ai_suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improved goal suggestion */}
          {goal.improved_goal && !goal.is_verified && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImproved(!showImproved)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {showImproved ? "Hide" : "Show"} AI-Improved Version
              </Button>
              {showImproved && (
                <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                  <p className="text-sm">{goal.improved_goal}</p>
                  <Button size="sm" onClick={useImprovedGoal}>
                    Use This Version
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Verification */}
          {goal.is_verified ? (
            <div className="text-xs text-muted-foreground">
              Verified by {goal.verified_by} on{" "}
              {goal.verified_at && new Date(goal.verified_at).toLocaleString()}
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleVerify} disabled={isLoading} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Verify & Accept Goal
              </Button>
              <p className="text-xs text-muted-foreground">
                Verifying will mark this goal as reviewed and ready for the IEP
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

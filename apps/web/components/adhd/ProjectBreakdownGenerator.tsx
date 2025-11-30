"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import {
  Sparkles,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
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

export interface ProjectBreakdown {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  totalSteps: number;
  completedSteps: number;
  aiGenerated: boolean;
  steps: ProjectStep[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectBreakdownGeneratorProps {
  assignmentId: string;
  assignmentTitle: string;
  assignmentDescription?: string;
  dueDate: string;
  existingBreakdown?: ProjectBreakdown;
  onGenerate: (
    assignmentId: string,
    params: { assignmentTitle: string; description?: string; dueDate: string }
  ) => Promise<ProjectBreakdown>;
  onSave: (breakdown: Partial<ProjectBreakdown>) => Promise<void>;
  onStepUpdate?: (stepId: string, updates: Partial<ProjectStep>) => Promise<void>;
  className?: string;
}

export function ProjectBreakdownGenerator({
  assignmentId,
  assignmentTitle,
  assignmentDescription,
  dueDate,
  existingBreakdown,
  onGenerate,
  onSave,
  onStepUpdate,
  className,
}: ProjectBreakdownGeneratorProps) {
  const [breakdown, setBreakdown] = useState<ProjectBreakdown | undefined>(existingBreakdown);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await onGenerate(assignmentId, {
        assignmentTitle,
        description: assignmentDescription,
        dueDate,
      });
      setBreakdown(result);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddStep = () => {
    if (!breakdown) return;
    const newStep: ProjectStep = {
      id: `temp-${Date.now()}`,
      stepNumber: breakdown.steps.length + 1,
      title: "New Step",
      estimatedMinutes: 15,
      isCompleted: false,
    };
    setBreakdown({
      ...breakdown,
      steps: [...breakdown.steps, newStep],
      totalSteps: breakdown.totalSteps + 1,
    });
    setEditingStepId(newStep.id);
  };

  const handleDeleteStep = (stepId: string) => {
    if (!breakdown) return;
    const updatedSteps = breakdown.steps
      .filter((s) => s.id !== stepId)
      .map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setBreakdown({
      ...breakdown,
      steps: updatedSteps,
      totalSteps: updatedSteps.length,
      completedSteps: updatedSteps.filter((s) => s.isCompleted).length,
    });
  };

  const handleStepChange = (stepId: string, updates: Partial<ProjectStep>) => {
    if (!breakdown) return;
    setBreakdown({
      ...breakdown,
      steps: breakdown.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
    });
  };

  const handleSave = async () => {
    if (!breakdown) return;
    setIsSaving(true);
    try {
      await onSave(breakdown);
    } finally {
      setIsSaving(false);
    }
  };

  const totalMinutes = breakdown?.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0) || 0;
  const completedMinutes =
    breakdown?.steps
      .filter((s) => s.isCompleted)
      .reduce((sum, s) => sum + s.estimatedMinutes, 0) || 0;

  const progressPercent = breakdown
    ? Math.round((breakdown.completedSteps / breakdown.totalSteps) * 100)
    : 0;

  return (
    <Card className={cn("p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Project Breakdown</h3>
          {breakdown?.aiGenerated && (
            <Badge className="bg-purple-100 text-purple-700">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Generated
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {breakdown && (
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* No Breakdown State */}
      {!breakdown && (
        <div className="text-center py-8 space-y-4">
          <p className="text-gray-500">
            Break down this assignment into manageable steps with AI assistance
          </p>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Breakdown with AI
              </>
            )}
          </Button>
        </div>
      )}

      {/* Breakdown Content */}
      {breakdown && isExpanded && (
        <div className="space-y-4">
          {/* Progress Overview */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-500">
                {breakdown.completedSteps}/{breakdown.totalSteps} steps ({progressPercent}%)
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {completedMinutes}/{totalMinutes} min
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  Due: {new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-2">
            {breakdown.steps.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                isEditing={editingStepId === step.id}
                onEdit={() => setEditingStepId(step.id)}
                onCancelEdit={() => setEditingStepId(null)}
                onChange={(updates) => handleStepChange(step.id, updates)}
                onDelete={() => handleDeleteStep(step.id)}
                onToggleComplete={(completed) =>
                  handleStepChange(step.id, {
                    isCompleted: completed,
                    completedAt: completed ? new Date().toISOString() : undefined,
                  })
                }
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleAddStep}>
                <Plus className="h-4 w-4 mr-1" />
                Add Step
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", isGenerating && "animate-spin")} />
                Regenerate
              </Button>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// Step Card Component
interface StepCardProps {
  step: ProjectStep;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onChange: (updates: Partial<ProjectStep>) => void;
  onDelete: () => void;
  onToggleComplete: (completed: boolean) => void;
}

function StepCard({
  step,
  isEditing,
  onEdit,
  onCancelEdit,
  onChange,
  onDelete,
  onToggleComplete,
}: StepCardProps) {
  if (isEditing) {
    return (
      <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Step {step.stepNumber}</span>
        </div>
        <Input
          value={step.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Step title"
          className="font-medium"
        />
        <Textarea
          value={step.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Step description (optional)"
          rows={2}
        />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <Input
              type="number"
              value={step.estimatedMinutes}
              onChange={(e) => onChange({ estimatedMinutes: parseInt(e.target.value) || 15 })}
              className="w-20"
              min={5}
              step={5}
            />
            <span className="text-sm text-gray-500">min</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={step.suggestedDate?.split("T")[0] || ""}
              onChange={(e) => onChange({ suggestedDate: e.target.value })}
              className="w-40"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancelEdit}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border rounded-lg p-3 flex items-start gap-3 transition-all",
        step.isCompleted && "bg-green-50 dark:bg-green-900/20 border-green-200"
      )}
    >
      <GripVertical className="h-5 w-5 text-gray-300 cursor-grab mt-0.5" />
      <input
        type="checkbox"
        checked={step.isCompleted}
        onChange={(e) => onToggleComplete(e.target.checked)}
        className="h-5 w-5 rounded border-gray-300 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Step {step.stepNumber}</span>
          {step.suggestedDate && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(step.suggestedDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {step.estimatedMinutes}min
          </Badge>
        </div>
        <h4
          className={cn(
            "font-medium mt-1",
            step.isCompleted && "line-through text-gray-500"
          )}
        >
          {step.title}
        </h4>
        {step.description && (
          <p className="text-sm text-gray-500 mt-1">{step.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

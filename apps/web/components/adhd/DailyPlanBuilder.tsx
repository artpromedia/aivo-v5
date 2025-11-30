"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Plus,
  Trash2,
  Clock,
  GripVertical,
  Sparkles,
  Loader2,
  Save,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TimeBlockCategory =
  | "HOMEWORK"
  | "STUDY"
  | "PROJECT"
  | "READING"
  | "BREAK"
  | "MEAL"
  | "ACTIVITY"
  | "FREE_TIME";

export interface TimeBlock {
  id: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  title: string;
  category: TimeBlockCategory;
  description?: string;
  isCompleted: boolean;
  assignmentId?: string;
  projectStepId?: string;
}

export interface DailyPlan {
  id: string;
  learnerId: string;
  date: string;
  timeBlocks: TimeBlock[];
  aiGenerated: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface DailyPlanBuilderProps {
  date: string;
  existingPlan?: DailyPlan;
  onGeneratePlan: (date: string) => Promise<DailyPlan>;
  onSavePlan: (plan: Partial<DailyPlan>) => Promise<void>;
  onBlockComplete?: (blockId: string, completed: boolean) => Promise<void>;
  className?: string;
}

const categoryConfig: Record<TimeBlockCategory, { label: string; color: string; bgColor: string }> = {
  HOMEWORK: { label: "Homework", color: "text-blue-700", bgColor: "bg-blue-100 border-blue-300" },
  STUDY: { label: "Study", color: "text-purple-700", bgColor: "bg-purple-100 border-purple-300" },
  PROJECT: { label: "Project", color: "text-indigo-700", bgColor: "bg-indigo-100 border-indigo-300" },
  READING: { label: "Reading", color: "text-emerald-700", bgColor: "bg-emerald-100 border-emerald-300" },
  BREAK: { label: "Break", color: "text-orange-700", bgColor: "bg-orange-100 border-orange-300" },
  MEAL: { label: "Meal", color: "text-amber-700", bgColor: "bg-amber-100 border-amber-300" },
  ACTIVITY: { label: "Activity", color: "text-pink-700", bgColor: "bg-pink-100 border-pink-300" },
  FREE_TIME: { label: "Free Time", color: "text-gray-700", bgColor: "bg-gray-100 border-gray-300" },
};

// Generate time slots from 6am to 10pm
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    const h = hour.toString().padStart(2, "0");
    slots.push(`${h}:00`);
    slots.push(`${h}:30`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();

export function DailyPlanBuilder({
  date,
  existingPlan,
  onGeneratePlan,
  onSavePlan,
  onBlockComplete,
  className,
}: DailyPlanBuilderProps) {
  const [plan, setPlan] = useState<DailyPlan | undefined>(existingPlan);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await onGeneratePlan(date);
      setPlan(result);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;
    setIsSaving(true);
    try {
      await onSavePlan(plan);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlock = (startTime: string) => {
    if (!plan) {
      setPlan({
        id: `temp-${Date.now()}`,
        learnerId: "",
        date,
        timeBlocks: [],
        aiGenerated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    const newBlock: TimeBlock = {
      id: `temp-${Date.now()}`,
      startTime,
      endTime: addMinutes(startTime, 30),
      title: "New Task",
      category: "HOMEWORK",
      isCompleted: false,
    };
    
    setPlan((prev) =>
      prev
        ? { ...prev, timeBlocks: [...prev.timeBlocks, newBlock].sort((a, b) => a.startTime.localeCompare(b.startTime)) }
        : undefined
    );
    setEditingBlockId(newBlock.id);
  };

  const handleDeleteBlock = (blockId: string) => {
    setPlan((prev) =>
      prev
        ? { ...prev, timeBlocks: prev.timeBlocks.filter((b) => b.id !== blockId) }
        : undefined
    );
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<TimeBlock>) => {
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            timeBlocks: prev.timeBlocks.map((b) =>
              b.id === blockId ? { ...b, ...updates } : b
            ),
          }
        : undefined
    );
  };

  const handleToggleComplete = async (blockId: string, completed: boolean) => {
    handleUpdateBlock(blockId, { isCompleted: completed });
    if (onBlockComplete) {
      await onBlockComplete(blockId, completed);
    }
  };

  // Calculate which slots are occupied
  const getOccupiedSlots = useCallback(() => {
    if (!plan) return new Set<string>();
    const occupied = new Set<string>();
    plan.timeBlocks.forEach((block) => {
      let current = block.startTime;
      while (current < block.endTime) {
        occupied.add(current);
        current = addMinutes(current, 30);
      }
    });
    return occupied;
  }, [plan]);

  const occupiedSlots = getOccupiedSlots();

  // Get block at a specific time
  const getBlockAtTime = (time: string): TimeBlock | undefined => {
    return plan?.timeBlocks.find(
      (block) => block.startTime <= time && time < block.endTime
    );
  };

  // Calculate completed percentage
  const completedCount = plan?.timeBlocks.filter((b) => b.isCompleted).length || 0;
  const totalCount = plan?.timeBlocks.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className={cn("p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">{formattedDate}</h3>
            {plan?.aiGenerated && (
              <Badge className="bg-purple-100 text-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            )}
          </div>
          {plan && (
            <p className="text-sm text-gray-500 mt-1">
              {completedCount}/{totalCount} tasks completed ({progressPercent}%)
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            {plan ? "Regenerate" : "Generate Plan"}
          </Button>
          {plan && (
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {plan && totalCount > 0 && (
        <div className="mb-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Time Grid */}
      <div className="space-y-1">
        {timeSlots.map((time, index) => {
          const block = getBlockAtTime(time);
          const isBlockStart = block?.startTime === time;
          const isOccupied = occupiedSlots.has(time) && !isBlockStart;

          // Skip occupied slots that aren't the start of a block
          if (isOccupied) return null;

          return (
            <div key={time} className="flex items-stretch gap-2 min-h-[40px]">
              {/* Time Label */}
              <div className="w-16 text-xs text-gray-500 text-right py-2 flex-shrink-0">
                {time}
              </div>

              {/* Time Slot */}
              <div className="flex-1">
                {isBlockStart && block ? (
                  <TimeBlockCard
                    block={block}
                    isEditing={editingBlockId === block.id}
                    onEdit={() => setEditingBlockId(block.id)}
                    onCancelEdit={() => setEditingBlockId(null)}
                    onChange={(updates) => handleUpdateBlock(block.id, updates)}
                    onDelete={() => handleDeleteBlock(block.id)}
                    onToggleComplete={(completed) =>
                      handleToggleComplete(block.id, completed)
                    }
                  />
                ) : (
                  <button
                    onClick={() => handleAddBlock(time)}
                    className="w-full h-10 border border-dashed border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 text-gray-300" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Time Block Card Component
interface TimeBlockCardProps {
  block: TimeBlock;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onChange: (updates: Partial<TimeBlock>) => void;
  onDelete: () => void;
  onToggleComplete: (completed: boolean) => void;
}

function TimeBlockCard({
  block,
  isEditing,
  onEdit,
  onCancelEdit,
  onChange,
  onDelete,
  onToggleComplete,
}: TimeBlockCardProps) {
  const config = categoryConfig[block.category];
  const durationMinutes = getMinutesBetween(block.startTime, block.endTime);
  const height = Math.max(40, (durationMinutes / 30) * 40);

  if (isEditing) {
    return (
      <div
        className="border-2 border-blue-400 bg-blue-50 rounded-lg p-2 space-y-2"
        style={{ minHeight: height }}
      >
        <input
          type="text"
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full text-sm font-medium bg-white border rounded px-2 py-1"
          placeholder="Task title"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <select
            value={block.category}
            onChange={(e) => onChange({ category: e.target.value as TimeBlockCategory })}
            className="text-xs border rounded px-2 py-1"
          >
            {Object.entries(categoryConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 text-xs">
            <input
              type="time"
              value={block.startTime}
              onChange={(e) => onChange({ startTime: e.target.value })}
              className="border rounded px-1 py-0.5"
            />
            <span>-</span>
            <input
              type="time"
              value={block.endTime}
              onChange={(e) => onChange({ endTime: e.target.value })}
              className="border rounded px-1 py-0.5"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500">
            <Trash2 className="h-3 w-3" />
          </Button>
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
        "border rounded-lg p-2 flex items-start gap-2 cursor-pointer transition-all",
        config.bgColor,
        block.isCompleted && "opacity-60"
      )}
      style={{ minHeight: height }}
      onClick={onEdit}
    >
      <GripVertical className="h-4 w-4 text-gray-400 cursor-grab flex-shrink-0 mt-0.5" />
      <input
        type="checkbox"
        checked={block.isCompleted}
        onChange={(e) => {
          e.stopPropagation();
          onToggleComplete(e.target.checked);
        }}
        className="h-4 w-4 rounded mt-0.5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium text-sm truncate",
              config.color,
              block.isCompleted && "line-through"
            )}
          >
            {block.title}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          <Clock className="h-3 w-3" />
          <span>
            {block.startTime} - {block.endTime}
          </span>
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {config.label}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
}

function getMinutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

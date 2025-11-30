"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { 
  Calendar, 
  Save, 
  Plus, 
  X, 
  Check,
  GripVertical,
  Clock,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={`text-sm font-medium leading-none ${className || ''}`}>
    {children}
  </label>
);

export interface ScheduleItem {
  id: string;
  order: number;
  activity: string;
  imageUrl?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  isCompleted: boolean;
  notes?: string;
}

export interface VisualSchedule {
  id: string;
  autismProfileId: string;
  name: string;
  description?: string;
  scheduleType: string;
  items: ScheduleItem[];
  displayFormat: "vertical" | "horizontal" | "grid";
  showTimes: boolean;
  showCheckboxes: boolean;
  imageSize: "small" | "medium" | "large";
  colorCoding?: Record<string, string>;
  applicableDays: number[];
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  isTemplate: boolean;
  timesUsed: number;
  lastUsedAt?: string;
  completionRate?: number;
  createdAt: string;
  updatedAt: string;
}

interface VisualScheduleEditorProps {
  autismProfileId: string;
  initialSchedule?: Partial<VisualSchedule>;
  onSave: (schedule: Partial<VisualSchedule>) => Promise<void>;
  className?: string;
}

const scheduleTypes = [
  { value: "daily", label: "Daily Schedule" },
  { value: "weekly", label: "Weekly Schedule" },
  { value: "activity", label: "Activity Schedule" },
  { value: "class", label: "Class Schedule" },
  { value: "custom", label: "Custom" },
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function VisualScheduleEditor({
  autismProfileId,
  initialSchedule,
  onSave,
  className,
}: VisualScheduleEditorProps) {
  const [schedule, setSchedule] = useState<Partial<VisualSchedule>>({
    autismProfileId,
    name: "",
    scheduleType: "daily",
    items: [],
    displayFormat: "vertical",
    showTimes: true,
    showCheckboxes: true,
    imageSize: "medium",
    applicableDays: [],
    isActive: true,
    isTemplate: false,
    ...initialSchedule,
  });

  const [saving, setSaving] = useState(false);
  const [newActivity, setNewActivity] = useState("");
  const [newStartTime, setNewStartTime] = useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(schedule);
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    if (!newActivity.trim()) return;
    const items = schedule.items || [];
    const newItem: ScheduleItem = {
      id: `item_${Date.now()}`,
      order: items.length + 1,
      activity: newActivity.trim(),
      startTime: newStartTime || undefined,
      isCompleted: false,
    };
    setSchedule({ ...schedule, items: [...items, newItem] });
    setNewActivity("");
    setNewStartTime("");
  };

  const removeItem = (id: string) => {
    const items = (schedule.items || [])
      .filter((item) => item.id !== id)
      .map((item, index) => ({ ...item, order: index + 1 }));
    setSchedule({ ...schedule, items });
  };

  const toggleDay = (day: number) => {
    const days = schedule.applicableDays || [];
    if (days.includes(day)) {
      setSchedule({ ...schedule, applicableDays: days.filter((d) => d !== day) });
    } else {
      setSchedule({ ...schedule, applicableDays: [...days, day].sort() });
    }
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const items = [...(schedule.items || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    const reordered = items.map((item, i) => ({ ...item, order: i + 1 }));
    setSchedule({ ...schedule, items: reordered });
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Visual Schedule Editor
        </CardTitle>
        <CardDescription>
          Create visual schedules for daily routines and activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label>Schedule Name</Label>
            <Input
              value={schedule.name}
              onChange={(e) => setSchedule({ ...schedule, name: e.target.value })}
              placeholder="e.g., Morning Routine, School Day"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Schedule Type</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {scheduleTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={schedule.scheduleType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSchedule({ ...schedule, scheduleType: type.value })}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {schedule.scheduleType === "weekly" && (
            <div>
              <Label>Applicable Days</Label>
              <div className="flex gap-2 mt-2">
                {dayNames.map((day, i) => (
                  <Button
                    key={i}
                    variant={schedule.applicableDays?.includes(i) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(i)}
                    className="w-12"
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Display Settings */}
        <div className="space-y-4">
          <Label>Display Settings</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Format</Label>
              <div className="flex gap-1 mt-1">
                {(["vertical", "horizontal", "grid"] as const).map((format) => (
                  <Button
                    key={format}
                    variant={schedule.displayFormat === format ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSchedule({ ...schedule, displayFormat: format })}
                    className="capitalize"
                  >
                    {format}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Image Size</Label>
              <div className="flex gap-1 mt-1">
                {(["small", "medium", "large"] as const).map((size) => (
                  <Button
                    key={size}
                    variant={schedule.imageSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSchedule({ ...schedule, imageSize: size })}
                    className="capitalize"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={schedule.showTimes ? "default" : "outline"}
                size="sm"
                onClick={() => setSchedule({ ...schedule, showTimes: !schedule.showTimes })}
              >
                <Clock className="h-4 w-4 mr-1" />
                {schedule.showTimes ? "Times On" : "Times Off"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={schedule.showCheckboxes ? "default" : "outline"}
                size="sm"
                onClick={() => setSchedule({ ...schedule, showCheckboxes: !schedule.showCheckboxes })}
              >
                <Check className="h-4 w-4 mr-1" />
                {schedule.showCheckboxes ? "Checkboxes On" : "Checkboxes Off"}
              </Button>
            </div>
          </div>
        </div>

        {/* Schedule Items */}
        <div className="space-y-4">
          <Label>Schedule Items</Label>
          
          {/* Add new item */}
          <div className="flex gap-2">
            {schedule.showTimes && (
              <Input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-32"
              />
            )}
            <Input
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="Add activity..."
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              className="flex-1"
            />
            <Button onClick={addItem}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Items list */}
          <div className="space-y-2">
            {schedule.items?.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-background"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-6 h-6 object-cover rounded" />
                  ) : (
                    <Image className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {schedule.showTimes && item.startTime && (
                  <Badge variant="outline" className="font-mono">
                    {item.startTime}
                  </Badge>
                )}

                <span className="flex-1 font-medium">{item.activity}</span>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveItem(index, "up")}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveItem(index, "down")}
                    disabled={index === (schedule.items?.length || 0) - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {(!schedule.items || schedule.items.length === 0) && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No items yet. Add activities above.
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end gap-2">
          <Button onClick={handleSave} disabled={saving || !schedule.name}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

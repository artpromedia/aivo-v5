"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}>
    {children}
  </label>
);
import { 
  Image, 
  Save, 
  Plus, 
  X, 
  Eye,
  Printer,
  ArrowRight,
  List,
  Grid,
  Star,
  Clock,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type VisualSupportType = 
  | "FIRST_THEN"
  | "VISUAL_SCHEDULE"
  | "CHOICE_BOARD"
  | "TASK_ANALYSIS"
  | "SOCIAL_STORY"
  | "EMOTION_CHART"
  | "TOKEN_BOARD"
  | "TIMER"
  | "COPING_CARD"
  | "RULE_REMINDER";

export interface VisualSupport {
  id: string;
  autismProfileId: string;
  type: VisualSupportType;
  title: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  imageUrls: string[];
  content?: Record<string, unknown>;
  isActive: boolean;
  isPrintable: boolean;
  showOnDashboard: boolean;
  displayOrder: number;
  contexts: string[];
  subjects: string[];
  activities: string[];
  usageCount: number;
  lastUsedAt?: string;
  effectivenessRating?: number;
  isSharedWithParent: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VisualSupportBuilderProps {
  autismProfileId: string;
  onSave: (support: Partial<VisualSupport>) => Promise<void>;
  initialSupport?: Partial<VisualSupport>;
  className?: string;
}

const supportTypes: { value: VisualSupportType; label: string; icon: typeof Image; description: string }[] = [
  { value: "FIRST_THEN", label: "First-Then Board", icon: ArrowRight, description: "Show what comes first and what reward/activity follows" },
  { value: "VISUAL_SCHEDULE", label: "Visual Schedule", icon: List, description: "Sequence of activities or steps" },
  { value: "CHOICE_BOARD", label: "Choice Board", icon: Grid, description: "Visual options to choose from" },
  { value: "TASK_ANALYSIS", label: "Task Analysis", icon: List, description: "Step-by-step breakdown of a task" },
  { value: "EMOTION_CHART", label: "Emotion Chart", icon: Heart, description: "Visual scale for identifying emotions" },
  { value: "TOKEN_BOARD", label: "Token Board", icon: Star, description: "Visual reinforcement system" },
  { value: "TIMER", label: "Visual Timer", icon: Clock, description: "Countdown timer with visual display" },
  { value: "COPING_CARD", label: "Coping Card", icon: Heart, description: "Strategies for managing emotions" },
  { value: "RULE_REMINDER", label: "Rule Reminder", icon: List, description: "Visual rules display" },
];

const contextOptions = ["classroom", "home", "therapy", "community", "cafeteria", "playground", "bus"];

export function VisualSupportBuilder({
  autismProfileId,
  onSave,
  initialSupport,
  className,
}: VisualSupportBuilderProps) {
  const [support, setSupport] = useState<Partial<VisualSupport>>({
    autismProfileId,
    type: "FIRST_THEN",
    title: "",
    isActive: true,
    isPrintable: true,
    showOnDashboard: false,
    displayOrder: 0,
    contexts: [],
    subjects: [],
    activities: [],
    imageUrls: [],
    isSharedWithParent: true,
    isTemplate: false,
    ...initialSupport,
  });

  const [saving, setSaving] = useState(false);
  const [newContext, setNewContext] = useState("");
  
  // First-Then content
  const [firstText, setFirstText] = useState("");
  const [thenText, setThenText] = useState("");
  
  // Choice board content
  const [choices, setChoices] = useState<{ id: string; text: string; imageUrl?: string }[]>([]);
  const [newChoice, setNewChoice] = useState("");
  
  // Task analysis steps
  const [steps, setSteps] = useState<{ stepNumber: number; text: string; imageUrl?: string }[]>([]);
  const [newStep, setNewStep] = useState("");

  const handleSave = async () => {
    // Build content based on type
    let content: Record<string, unknown> = {};
    
    if (support.type === "FIRST_THEN") {
      content = {
        first: { text: firstText, imageUrl: "" },
        then: { text: thenText, imageUrl: "" },
      };
    } else if (support.type === "CHOICE_BOARD") {
      content = { choices, maxChoices: 1 };
    } else if (support.type === "TASK_ANALYSIS") {
      content = { steps };
    }

    setSaving(true);
    try {
      await onSave({ ...support, content });
    } finally {
      setSaving(false);
    }
  };

  const addChoice = () => {
    if (!newChoice.trim()) return;
    setChoices([...choices, { id: `choice_${Date.now()}`, text: newChoice.trim() }]);
    setNewChoice("");
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    setSteps([...steps, { stepNumber: steps.length + 1, text: newStep.trim() }]);
    setNewStep("");
  };

  const toggleContext = (context: string) => {
    const current = support.contexts || [];
    if (current.includes(context)) {
      setSupport({ ...support, contexts: current.filter((c) => c !== context) });
    } else {
      setSupport({ ...support, contexts: [...current, context] });
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Visual Support Builder
        </CardTitle>
        <CardDescription>
          Create custom visual supports for learning and behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Support Type Selection */}
        <div>
          <Label>Support Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {supportTypes.map((type) => (
              <Button
                key={type.value}
                variant={support.type === type.value ? "default" : "outline"}
                onClick={() => setSupport({ ...support, type: type.value })}
                className="h-auto py-3 justify-start"
              >
                <type.icon className="h-4 w-4 mr-2 shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">{type.label}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={support.title}
              onChange={(e) => setSupport({ ...support, title: e.target.value })}
              placeholder="Enter a title for this visual support"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={support.description || ""}
              onChange={(e) => setSupport({ ...support, description: e.target.value })}
              placeholder="Describe when and how to use this support"
              rows={2}
            />
          </div>
          <div>
            <Label>Instructions</Label>
            <Textarea
              value={support.instructions || ""}
              onChange={(e) => setSupport({ ...support, instructions: e.target.value })}
              placeholder="Step-by-step instructions for use"
              rows={2}
            />
          </div>
        </div>

        {/* Type-Specific Content */}
        {support.type === "FIRST_THEN" && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium">First-Then Content</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First (Task/Activity)</Label>
                <Input
                  value={firstText}
                  onChange={(e) => setFirstText(e.target.value)}
                  placeholder="e.g., Finish math worksheet"
                />
                <div className="mt-2 h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                  <Plus className="h-6 w-6 mr-2" />
                  Add Image
                </div>
              </div>
              <div>
                <Label>Then (Reward/Next Activity)</Label>
                <Input
                  value={thenText}
                  onChange={(e) => setThenText(e.target.value)}
                  placeholder="e.g., 5 minutes iPad time"
                />
                <div className="mt-2 h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                  <Plus className="h-6 w-6 mr-2" />
                  Add Image
                </div>
              </div>
            </div>
          </div>
        )}

        {support.type === "CHOICE_BOARD" && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium">Choice Board Options</h4>
            <div className="flex gap-2">
              <Input
                value={newChoice}
                onChange={(e) => setNewChoice(e.target.value)}
                placeholder="Add a choice..."
                onKeyDown={(e) => e.key === "Enter" && addChoice()}
              />
              <Button onClick={addChoice}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {choices.map((choice, i) => (
                <div key={choice.id} className="p-3 border rounded-lg bg-background">
                  <div className="h-16 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground mb-2">
                    <Image className="h-6 w-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{choice.text}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChoices(choices.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {support.type === "TASK_ANALYSIS" && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium">Task Steps</h4>
            <div className="flex gap-2">
              <Input
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                placeholder="Add a step..."
                onKeyDown={(e) => e.key === "Enter" && addStep()}
              />
              <Button onClick={addStep}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {step.stepNumber}
                  </div>
                  <span className="flex-1">{step.text}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSteps(steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, stepNumber: idx + 1 })))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contexts */}
        <div>
          <Label>Where to Use</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {contextOptions.map((context) => (
              <Button
                key={context}
                variant={support.contexts?.includes(context) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleContext(context)}
              >
                {context.charAt(0).toUpperCase() + context.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-3">
          <Label>Settings</Label>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Show on Dashboard</span>
            </div>
            <Button
              variant={support.showOnDashboard ? "default" : "outline"}
              size="sm"
              onClick={() => setSupport({ ...support, showOnDashboard: !support.showOnDashboard })}
            >
              {support.showOnDashboard ? "Yes" : "No"}
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              <span>Printable</span>
            </div>
            <Button
              variant={support.isPrintable ? "default" : "outline"}
              size="sm"
              onClick={() => setSupport({ ...support, isPrintable: !support.isPrintable })}
            >
              {support.isPrintable ? "Yes" : "No"}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving || !support.title}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Support"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

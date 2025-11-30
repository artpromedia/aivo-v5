"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { 
  ClipboardList, 
  Plus,
  Save,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface BehaviorIncident {
  id?: string;
  learnerId: string;
  date: string;
  time: string;
  location: string;
  setting: string;
  antecedent: string;
  antecedentCategory: string;
  behavior: string;
  behaviorDescription: string;
  intensity: "low" | "moderate" | "high" | "severe";
  duration?: number;
  consequence: string;
  consequenceCategory: string;
  functionHypothesis?: string;
  notes?: string;
  reportedBy: string;
}

interface ABCDataEntryProps {
  learnerId: string;
  incident?: Partial<BehaviorIncident>;
  onSave?: (incident: BehaviorIncident) => void;
  onCancel?: () => void;
  className?: string;
}

const ANTECEDENT_CATEGORIES = [
  { value: "demand", label: "Demand/Task Presented" },
  { value: "transition", label: "Transition" },
  { value: "denied", label: "Told No / Access Denied" },
  { value: "attention", label: "Attention Given to Others" },
  { value: "sensory", label: "Sensory Input" },
  { value: "waiting", label: "Waiting Required" },
  { value: "change", label: "Unexpected Change" },
  { value: "social", label: "Social Interaction" },
  { value: "alone", label: "Left Alone" },
  { value: "other", label: "Other" },
];

const CONSEQUENCE_CATEGORIES = [
  { value: "attention", label: "Received Attention" },
  { value: "escape", label: "Escaped Task/Demand" },
  { value: "tangible", label: "Received Item/Activity" },
  { value: "sensory", label: "Sensory Stimulation" },
  { value: "redirection", label: "Redirected" },
  { value: "ignored", label: "Ignored/No Response" },
  { value: "timeout", label: "Time Out" },
  { value: "verbal", label: "Verbal Correction" },
  { value: "physical", label: "Physical Guidance" },
  { value: "other", label: "Other" },
];

const INTENSITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "moderate", label: "Moderate", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "severe", label: "Severe", color: "bg-red-100 text-red-800" },
];

const LOCATIONS = [
  "Classroom",
  "Hallway",
  "Cafeteria",
  "Playground",
  "Gym",
  "Library",
  "Bathroom",
  "Bus",
  "Home",
  "Other",
];

export function ABCDataEntry({
  learnerId,
  incident,
  onSave,
  onCancel,
  className,
}: ABCDataEntryProps) {
  const [formData, setFormData] = useState<Partial<BehaviorIncident>>({
    learnerId,
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    location: "",
    setting: "",
    antecedent: "",
    antecedentCategory: "",
    behavior: "",
    behaviorDescription: "",
    intensity: "moderate",
    duration: undefined,
    consequence: "",
    consequenceCategory: "",
    functionHypothesis: "",
    notes: "",
    reportedBy: "",
    ...incident,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof BehaviorIncident, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.behavior || !formData.antecedent || !formData.consequence) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/autism/behavior`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learner_id: learnerId,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          setting: formData.setting,
          antecedent: formData.antecedent,
          antecedent_category: formData.antecedentCategory,
          behavior: formData.behavior,
          behavior_description: formData.behaviorDescription,
          intensity: formData.intensity,
          duration_seconds: formData.duration,
          consequence: formData.consequence,
          consequence_category: formData.consequenceCategory,
          function_hypothesis: formData.functionHypothesis,
          notes: formData.notes,
          reported_by: formData.reportedBy,
        }),
      });

      if (response.ok) {
        const saved = await response.json();
        onSave?.(saved);
      }
    } catch (error) {
      console.error("Failed to save incident:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          ABC Data Collection
        </CardTitle>
        <CardDescription>
          Record antecedent, behavior, and consequence data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date, Time, Location */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Date
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Time</label>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) => handleChange("time", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Location
            </label>
            <Select value={formData.location} onValueChange={(v) => handleChange("location", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc.toLowerCase()}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <User className="h-4 w-4" />
              Reporter
            </label>
            <Input
              value={formData.reportedBy}
              onChange={(e) => handleChange("reportedBy", e.target.value)}
              placeholder="Your name"
            />
          </div>
        </div>

        {/* Antecedent */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
          <h4 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">A</span>
            Antecedent (What happened before?)
          </h4>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select 
              value={formData.antecedentCategory} 
              onValueChange={(v) => handleChange("antecedentCategory", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {ANTECEDENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.antecedent}
              onChange={(e) => handleChange("antecedent", e.target.value)}
              placeholder="Describe what happened immediately before the behavior..."
              rows={2}
            />
          </div>
        </div>

        {/* Behavior */}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-3">
          <h4 className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-sm">B</span>
            Behavior (What did the learner do?)
          </h4>
          <div className="space-y-2">
            <label className="text-sm font-medium">Behavior</label>
            <Input
              value={formData.behavior}
              onChange={(e) => handleChange("behavior", e.target.value)}
              placeholder="Brief behavior name (e.g., hitting, screaming)"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.behaviorDescription}
              onChange={(e) => handleChange("behaviorDescription", e.target.value)}
              placeholder="Describe the behavior in observable, measurable terms..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Intensity
              </label>
              <div className="flex gap-2">
                {INTENSITY_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={formData.intensity === opt.value ? "default" : "outline"}
                    size="sm"
                    className={formData.intensity === opt.value ? opt.color : ""}
                    onClick={() => handleChange("intensity", opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (seconds)</label>
              <Input
                type="number"
                value={formData.duration || ""}
                onChange={(e) => handleChange("duration", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        {/* Consequence */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-3">
          <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">C</span>
            Consequence (What happened after?)
          </h4>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select 
              value={formData.consequenceCategory} 
              onValueChange={(v) => handleChange("consequenceCategory", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {CONSEQUENCE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.consequence}
              onChange={(e) => handleChange("consequence", e.target.value)}
              placeholder="Describe what happened immediately after the behavior..."
              rows={2}
            />
          </div>
        </div>

        {/* Advanced Options */}
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
          {showAdvanced ? "Hide" : "Show"} Advanced Options
        </Button>

        {showAdvanced && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Target className="h-4 w-4" />
                Function Hypothesis
              </label>
              <Select 
                value={formData.functionHypothesis} 
                onValueChange={(v) => handleChange("functionHypothesis", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="What might maintain this behavior?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attention">Attention</SelectItem>
                  <SelectItem value="escape">Escape/Avoidance</SelectItem>
                  <SelectItem value="tangible">Access to Tangibles</SelectItem>
                  <SelectItem value="sensory">Automatic/Sensory</SelectItem>
                  <SelectItem value="multiple">Multiple Functions</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Setting Events / Context</label>
              <Textarea
                value={formData.setting}
                onChange={(e) => handleChange("setting", e.target.value)}
                placeholder="Relevant setting events (e.g., poor sleep, illness, schedule change)..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any other relevant observations..."
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.behavior || !formData.antecedent || !formData.consequence || isSaving}
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Incident
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setFormData({
                learnerId,
                date: new Date().toISOString().split("T")[0],
                time: new Date().toTimeString().slice(0, 5),
                location: "",
                setting: "",
                antecedent: "",
                antecedentCategory: "",
                behavior: "",
                behaviorDescription: "",
                intensity: "moderate",
                duration: undefined,
                consequence: "",
                consequenceCategory: "",
                functionHypothesis: "",
                notes: "",
                reportedBy: formData.reportedBy,
              });
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

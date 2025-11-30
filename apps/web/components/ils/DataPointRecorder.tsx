"use client";

import React, { useState, ChangeEvent } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  Save, Plus, CheckCircle2, Circle, 
  Hand, Eye, MessageSquare, Pointer 
} from "lucide-react";

// Types
interface TaskStep {
  stepNumber: number;
  description: string;
}

interface StepDataEntry {
  stepNumber: number;
  completed: boolean;
  promptLevel: string;
  notes?: string;
}

interface DataPointRecorderProps {
  skillId: string;
  skillName: string;
  steps: TaskStep[];
  settings: string[];
  onSave: (data: DataPointData) => void;
  isSubmitting?: boolean;
}

interface DataPointData {
  skillId: string;
  sessionDate: string;
  setting: string;
  duration?: number;
  instructor?: string;
  stepByStepData: StepDataEntry[];
  behaviorNotes?: string;
  environmentalFactors?: {
    noiseLevel?: string;
    distractions?: string;
    peerPresence?: boolean;
  };
}

const promptLevels = [
  { value: "FULL_PHYSICAL", label: "Full Physical", icon: <Hand className="h-4 w-4" /> },
  { value: "PARTIAL_PHYSICAL", label: "Partial Physical", icon: <Hand className="h-4 w-4 opacity-60" /> },
  { value: "MODELING", label: "Modeling", icon: <Eye className="h-4 w-4" /> },
  { value: "GESTURAL", label: "Gestural", icon: <Pointer className="h-4 w-4" /> },
  { value: "VERBAL_DIRECT", label: "Verbal Direct", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "VERBAL_INDIRECT", label: "Verbal Indirect", icon: <MessageSquare className="h-4 w-4 opacity-60" /> },
  { value: "VISUAL", label: "Visual", icon: <Eye className="h-4 w-4 opacity-60" /> },
  { value: "INDEPENDENT", label: "Independent", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
];

const settingLabels: Record<string, string> = {
  CLASSROOM: "Classroom",
  HOME: "Home",
  SCHOOL_CAFETERIA: "School Cafeteria",
  SCHOOL_COMMON: "School Common Areas",
  COMMUNITY_STORE: "Community Store",
  COMMUNITY_RESTAURANT: "Restaurant",
  COMMUNITY_TRANSPORT: "Public Transportation",
  COMMUNITY_MEDICAL: "Medical Facility",
  COMMUNITY_RECREATION: "Recreation Center",
  COMMUNITY_WORKPLACE: "Workplace",
  COMMUNITY_GOVERNMENT: "Government Office",
  COMMUNITY_LIBRARY: "Library",
  COMMUNITY_BANK: "Bank",
  SIMULATION: "Simulation/Practice",
  VIRTUAL: "Virtual/Online",
};

export function DataPointRecorder({
  skillId,
  skillName,
  steps,
  settings,
  onSave,
  isSubmitting = false,
}: DataPointRecorderProps) {
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [setting, setSetting] = useState(settings[0] || "CLASSROOM");
  const [duration, setDuration] = useState<number | undefined>();
  const [instructor, setInstructor] = useState("");
  const [behaviorNotes, setBehaviorNotes] = useState("");
  const [noiseLevel, setNoiseLevel] = useState("medium");
  const [distractions, setDistractions] = useState("");
  const [peerPresence, setPeerPresence] = useState(false);

  // Initialize step data
  const [stepData, setStepData] = useState<StepDataEntry[]>(
    steps.map((step) => ({
      stepNumber: step.stepNumber,
      completed: false,
      promptLevel: "FULL_PHYSICAL",
      notes: "",
    }))
  );

  const handleStepToggle = (stepNumber: number) => {
    setStepData((prev) =>
      prev.map((s) =>
        s.stepNumber === stepNumber ? { ...s, completed: !s.completed } : s
      )
    );
  };

  const handlePromptChange = (stepNumber: number, promptLevel: string) => {
    setStepData((prev) =>
      prev.map((s) =>
        s.stepNumber === stepNumber ? { ...s, promptLevel } : s
      )
    );
  };

  const handleStepNotes = (stepNumber: number, notes: string) => {
    setStepData((prev) =>
      prev.map((s) =>
        s.stepNumber === stepNumber ? { ...s, notes } : s
      )
    );
  };

  const handleMarkAllCompleted = (promptLevel: string) => {
    setStepData((prev) =>
      prev.map((s) => ({ ...s, completed: true, promptLevel }))
    );
  };

  const handleSave = () => {
    const data: DataPointData = {
      skillId,
      sessionDate,
      setting,
      duration,
      instructor: instructor || undefined,
      stepByStepData: stepData,
      behaviorNotes: behaviorNotes || undefined,
      environmentalFactors: {
        noiseLevel,
        distractions: distractions || undefined,
        peerPresence,
      },
    };
    onSave(data);
  };

  // Calculate completion stats
  const completedSteps = stepData.filter((s) => s.completed).length;
  const independentSteps = stepData.filter(
    (s) => s.completed && s.promptLevel === "INDEPENDENT"
  ).length;
  const accuracy = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const independence = completedSteps > 0 ? (independentSteps / completedSteps) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Session Info */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold">Session Information</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Setting</label>
              <select
                value={setting}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSetting(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {settings.map((s) => (
                  <option key={s} value={s}>
                    {settingLabels[s] || s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (min)</label>
              <input
                type="number"
                min={1}
                value={duration || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Minutes"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Instructor</label>
              <input
                type="text"
                value={instructor}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setInstructor(e.target.value)}
                placeholder="Name"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Quick Actions:</span>
            <button
              onClick={() => handleMarkAllCompleted("INDEPENDENT")}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
            >
              All Independent
            </button>
            <button
              onClick={() => handleMarkAllCompleted("VERBAL_DIRECT")}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              All Verbal
            </button>
            <button
              onClick={() => handleMarkAllCompleted("MODELING")}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200"
            >
              All Modeling
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Data Collection */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{skillName} - Task Analysis</h3>
            <div className="flex items-center gap-4 text-sm">
              <span>Accuracy: <strong>{accuracy.toFixed(0)}%</strong></span>
              <span>Independence: <strong>{independence.toFixed(0)}%</strong></span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step) => {
              const data = stepData.find((s) => s.stepNumber === step.stepNumber);
              if (!data) return null;

              return (
                <div
                  key={step.stepNumber}
                  className={`p-3 border rounded-lg transition-all ${
                    data.completed ? "bg-green-50 border-green-200" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Completion Toggle */}
                    <button
                      onClick={() => handleStepToggle(step.stepNumber)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {data.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-300" />
                      )}
                    </button>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Step {step.stepNumber}
                        </Badge>
                        <span className="font-medium">{step.description}</span>
                      </div>

                      {/* Prompt Level Selection */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {promptLevels.map((prompt) => (
                          <button
                            key={prompt.value}
                            onClick={() => handlePromptChange(step.stepNumber, prompt.value)}
                            className={`
                              inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md
                              transition-colors
                              ${
                                data.promptLevel === prompt.value
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }
                            `}
                          >
                            {prompt.icon}
                            {prompt.label}
                          </button>
                        ))}
                      </div>

                      {/* Step Notes */}
                      <input
                        type="text"
                        placeholder="Notes for this step..."
                        value={data.notes || ""}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleStepNotes(step.stepNumber, e.target.value)}
                        className="mt-2 w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes & Environmental Factors */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold">Additional Information</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Behavior Notes</label>
              <textarea
                value={behaviorNotes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBehaviorNotes(e.target.value)}
                placeholder="Note any behaviors, challenges, or successes..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Noise Level</label>
                <select
                  value={noiseLevel}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setNoiseLevel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Distractions</label>
                <input
                  type="text"
                  value={distractions}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDistractions(e.target.value)}
                  placeholder="Any distractions?"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="peerPresence"
                  checked={peerPresence}
                  onChange={(e) => setPeerPresence(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="peerPresence" className="text-sm">Peers Present</label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className={`
            px-6 py-2 rounded-md font-medium flex items-center gap-2
            ${isSubmitting
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
            }
          `}
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save Data Point"}
        </button>
      </div>
    </div>
  );
}

export default DataPointRecorder;

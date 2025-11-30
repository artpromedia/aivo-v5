"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select, SelectItem } from "@/components/ui/Select";
import {
  Home,
  Plus,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  FileText,
  Download,
  Printer,
  Video,
  Mic,
  Image as ImageIcon,
  BookOpen,
  Target,
  Star,
  MessageSquare,
  Copy,
  Eye,
} from "lucide-react";

// Types matching Prisma schema
type HomeworkStatus = "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "SKIPPED";
type GoalArea =
  | "ARTICULATION"
  | "FLUENCY"
  | "RECEPTIVE_LANGUAGE"
  | "EXPRESSIVE_LANGUAGE"
  | "PRAGMATIC_LANGUAGE"
  | "VOICE"
  | "MIXED";

interface ParentSpeechHomework {
  id: string;
  slpProfileId: string;
  goalArea: GoalArea;
  title: string;
  instructions: string;
  targetSkills: string[];
  materials: string[];
  videoUrl: string | null;
  audioModelUrl: string | null;
  imageUrls: string[];
  frequencyPerWeek: number;
  durationMinutes: number;
  assignedDate: string;
  dueDate: string;
  status: HomeworkStatus;
  parentNotes: string | null;
  completionLogs: CompletionLog[];
  createdAt: string;
  updatedAt: string;
}

interface CompletionLog {
  date: string;
  durationMinutes: number;
  completed: boolean;
  accuracy?: number;
  notes?: string;
  parentRating?: number;
}

interface ParentHomeworkAssignerProps {
  learnerId: string;
  profileId: string;
  learnerName: string;
  homework?: ParentSpeechHomework[];
  onHomeworkCreate?: (homework: Partial<ParentSpeechHomework>) => Promise<void>;
  onHomeworkUpdate?: (id: string, updates: Partial<ParentSpeechHomework>) => Promise<void>;
  onHomeworkDelete?: (id: string) => Promise<void>;
  onSendToParent?: (homeworkId: string) => Promise<void>;
}

const GOAL_AREAS: { value: GoalArea; label: string; icon: typeof Target }[] = [
  { value: "ARTICULATION", label: "Articulation", icon: Mic },
  { value: "FLUENCY", label: "Fluency", icon: Clock },
  { value: "RECEPTIVE_LANGUAGE", label: "Receptive Language", icon: BookOpen },
  { value: "EXPRESSIVE_LANGUAGE", label: "Expressive Language", icon: MessageSquare },
  { value: "PRAGMATIC_LANGUAGE", label: "Pragmatic/Social", icon: Target },
  { value: "VOICE", label: "Voice", icon: Mic },
  { value: "MIXED", label: "Mixed", icon: Target },
];

const STATUS_CONFIG: Record<HomeworkStatus, { label: string; color: string }> = {
  ASSIGNED: { label: "Assigned", color: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700" },
  OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-700" },
  SKIPPED: { label: "Skipped", color: "bg-gray-100 text-gray-700" },
};

// Pre-built homework templates
const HOMEWORK_TEMPLATES: Partial<ParentSpeechHomework>[] = [
  {
    goalArea: "ARTICULATION",
    title: "Sound Practice Cards",
    instructions:
      "Practice the target sound using the picture cards. Say each word 3 times clearly. Praise your child for good attempts!",
    targetSkills: ["Sound production", "Word-level practice"],
    frequencyPerWeek: 5,
    durationMinutes: 10,
  },
  {
    goalArea: "ARTICULATION",
    title: "Reading Practice",
    instructions:
      "Read the story together, encouraging your child to use their target sound. Stop and practice any words that are difficult.",
    targetSkills: ["Sound production", "Reading fluency", "Carryover"],
    frequencyPerWeek: 3,
    durationMinutes: 15,
  },
  {
    goalArea: "FLUENCY",
    title: "Easy Starts Practice",
    instructions:
      "Practice starting words with a gentle, easy onset. Begin with single words, then try short phrases. Keep it fun and pressure-free!",
    targetSkills: ["Easy onset", "Smooth speech"],
    frequencyPerWeek: 5,
    durationMinutes: 10,
  },
  {
    goalArea: "FLUENCY",
    title: "Turtle Talk Time",
    instructions:
      "Practice speaking slowly like a turtle during a special activity (e.g., snack time, car ride). Model slow speech yourself.",
    targetSkills: ["Rate control", "Stretched speech"],
    frequencyPerWeek: 4,
    durationMinutes: 10,
  },
  {
    goalArea: "RECEPTIVE_LANGUAGE",
    title: "Following Directions Game",
    instructions:
      "Give your child 2-3 step directions during daily activities. Start simple and gradually increase complexity. Make it a game!",
    targetSkills: ["Following directions", "Auditory memory"],
    frequencyPerWeek: 5,
    durationMinutes: 10,
  },
  {
    goalArea: "EXPRESSIVE_LANGUAGE",
    title: "Sentence Building Practice",
    instructions:
      "Look at pictures together and help your child make complete sentences about what they see. Expand on their ideas.",
    targetSkills: ["Sentence formulation", "Vocabulary use"],
    frequencyPerWeek: 4,
    durationMinutes: 15,
  },
  {
    goalArea: "PRAGMATIC_LANGUAGE",
    title: "Conversation Practice",
    instructions:
      "Practice having back-and-forth conversations during dinner or car rides. Focus on taking turns, staying on topic, and asking questions.",
    targetSkills: ["Turn-taking", "Topic maintenance", "Asking questions"],
    frequencyPerWeek: 5,
    durationMinutes: 10,
  },
  {
    goalArea: "VOICE",
    title: "Gentle Voice Practice",
    instructions:
      "Remind your child to use their 'gentle voice' throughout the day. Practice speaking with relaxed breathing and good posture.",
    targetSkills: ["Vocal hygiene", "Breath support"],
    frequencyPerWeek: 7,
    durationMinutes: 5,
  },
];

export function ParentHomeworkAssigner({
  learnerId,
  profileId,
  learnerName,
  homework: initialHomework = [],
  onHomeworkCreate,
  onHomeworkUpdate,
  onHomeworkDelete,
  onSendToParent,
}: ParentHomeworkAssignerProps) {
  const [homework, setHomework] = useState<ParentSpeechHomework[]>(initialHomework);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<ParentSpeechHomework> | null>(
    null
  );
  const [previewHomework, setPreviewHomework] = useState<ParentSpeechHomework | null>(null);
  const [filterArea, setFilterArea] = useState<GoalArea | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<HomeworkStatus | "ALL">("ALL");

  // New homework form state
  const [newHomework, setNewHomework] = useState<Partial<ParentSpeechHomework>>({
    goalArea: "ARTICULATION",
    title: "",
    instructions: "",
    targetSkills: [],
    materials: [],
    videoUrl: "",
    audioModelUrl: "",
    imageUrls: [],
    frequencyPerWeek: 5,
    durationMinutes: 10,
    assignedDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "ASSIGNED",
    completionLogs: [],
  });

  const [newSkill, setNewSkill] = useState("");
  const [newMaterial, setNewMaterial] = useState("");

  useEffect(() => {
    setHomework(initialHomework);
  }, [initialHomework]);

  const applyTemplate = (template: Partial<ParentSpeechHomework>) => {
    setNewHomework({
      ...newHomework,
      ...template,
      assignedDate: new Date().toISOString().split("T")[0],
      dueDate: getDefaultDueDate(),
    });
    setSelectedTemplate(template);
  };

  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split("T")[0];
  };

  const handleCreateHomework = async () => {
    if (!newHomework.title || !newHomework.instructions) return;

    const homeworkData: Partial<ParentSpeechHomework> = {
      ...newHomework,
      slpProfileId: profileId,
      dueDate: newHomework.dueDate || getDefaultDueDate(),
      completionLogs: [],
    };

    if (onHomeworkCreate) {
      await onHomeworkCreate(homeworkData);
    } else {
      const created: ParentSpeechHomework = {
        ...homeworkData,
        id: `hw-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ParentSpeechHomework;
      setHomework((prev) => [...prev, created]);
    }

    setIsCreating(false);
    setSelectedTemplate(null);
    setNewHomework({
      goalArea: "ARTICULATION",
      title: "",
      instructions: "",
      targetSkills: [],
      materials: [],
      videoUrl: "",
      audioModelUrl: "",
      imageUrls: [],
      frequencyPerWeek: 5,
      durationMinutes: 10,
      assignedDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      status: "ASSIGNED",
      completionLogs: [],
    });
  };

  const handleDeleteHomework = async (id: string) => {
    if (!confirm("Are you sure you want to delete this homework?")) return;

    if (onHomeworkDelete) {
      await onHomeworkDelete(id);
    } else {
      setHomework((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const handleSendToParent = async (id: string) => {
    if (onSendToParent) {
      await onSendToParent(id);
    }
    alert(`Homework sent to ${learnerName}'s parent/caregiver!`);
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setNewHomework({
        ...newHomework,
        targetSkills: [...(newHomework.targetSkills || []), newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setNewHomework({
      ...newHomework,
      targetSkills: (newHomework.targetSkills || []).filter((_, i) => i !== index),
    });
  };

  const addMaterial = () => {
    if (newMaterial.trim()) {
      setNewHomework({
        ...newHomework,
        materials: [...(newHomework.materials || []), newMaterial.trim()],
      });
      setNewMaterial("");
    }
  };

  const removeMaterial = (index: number) => {
    setNewHomework({
      ...newHomework,
      materials: (newHomework.materials || []).filter((_, i) => i !== index),
    });
  };

  const filteredHomework = homework.filter((h) => {
    if (filterArea !== "ALL" && h.goalArea !== filterArea) return false;
    if (filterStatus !== "ALL" && h.status !== filterStatus) return false;
    return true;
  });

  const getCompletionRate = (hw: ParentSpeechHomework) => {
    if (!hw.completionLogs || hw.completionLogs.length === 0) return 0;
    const completed = hw.completionLogs.filter((log) => log.completed).length;
    return Math.round((completed / hw.completionLogs.length) * 100);
  };

  const getSummaryStats = () => {
    const total = homework.length;
    const active = homework.filter((h) => h.status === "ASSIGNED" || h.status === "IN_PROGRESS")
      .length;
    const completed = homework.filter((h) => h.status === "COMPLETED").length;
    const overdue = homework.filter((h) => h.status === "OVERDUE").length;
    return { total, active, completed, overdue };
  };

  const stats = getSummaryStats();

  const generatePrintableVersion = (hw: ParentSpeechHomework) => {
    // In a real app, this would generate a PDF
    const printContent = `
      SPEECH THERAPY HOME PRACTICE
      Student: ${learnerName}
      
      ${hw.title}
      Area: ${hw.goalArea}
      
      INSTRUCTIONS:
      ${hw.instructions}
      
      TARGET SKILLS:
      ${hw.targetSkills.join(", ")}
      
      SCHEDULE:
      ${hw.frequencyPerWeek}x per week, ${hw.durationMinutes} minutes each
      Due: ${new Date(hw.dueDate).toLocaleDateString()}
      
      MATERIALS NEEDED:
      ${hw.materials.join(", ") || "None specified"}
    `;
    console.log(printContent);
    alert("Print version generated! (Check console)");
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Assignments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Area:</span>
              <Select
                value={filterArea}
                onValueChange={(v: string) => setFilterArea(v as GoalArea | "ALL")}
                className="w-[180px]"
              >
                <SelectItem value="ALL">All Areas</SelectItem>
                {GOAL_AREAS.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Select
                value={filterStatus}
                onValueChange={(v: string) => setFilterStatus(v as HomeworkStatus | "ALL")}
                className="w-[160px]"
              >
                <SelectItem value="ALL">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="ml-auto">
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Assign Homework
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Homework Form */}
      {isCreating && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Create Home Practice Assignment for {learnerName}
            </CardTitle>
            <CardDescription>
              Select a template or create a custom assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Templates */}
            <div>
              <h4 className="font-medium mb-3">Quick Templates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {HOMEWORK_TEMPLATES.map((template, idx) => (
                  <Button
                    key={idx}
                    variant={selectedTemplate === template ? "default" : "outline"}
                    className="justify-start h-auto py-2 px-3 text-left"
                    onClick={() => applyTemplate(template)}
                  >
                    <div>
                      <div className="font-medium text-sm">{template.title}</div>
                      <div className="text-xs opacity-70">{template.goalArea}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Assignment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Goal Area *</label>
                  <Select
                    value={newHomework.goalArea}
                    onValueChange={(v: string) => setNewHomework({ ...newHomework, goalArea: v as GoalArea })}
                  >
                    {GOAL_AREAS.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    placeholder="e.g., /s/ Sound Practice"
                    value={newHomework.title || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewHomework({ ...newHomework, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium">Instructions for Parent *</label>
                <Textarea
                  placeholder="Clear, step-by-step instructions for the parent/caregiver..."
                  value={newHomework.instructions || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewHomework({ ...newHomework, instructions: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Target Skills */}
              <div className="mt-4">
                <label className="text-sm font-medium">Target Skills</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add a skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  />
                  <Button variant="outline" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(newHomework.targetSkills || []).map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      {skill}
                      <button onClick={() => removeSkill(idx)} className="ml-1 hover:text-red-500">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Frequency (per week)</label>
                  <Input
                    type="number"
                    min="1"
                    max="7"
                    value={newHomework.frequencyPerWeek || 5}
                    onChange={(e) =>
                      setNewHomework({
                        ...newHomework,
                        frequencyPerWeek: parseInt(e.target.value) || 5,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    value={newHomework.durationMinutes || 10}
                    onChange={(e) =>
                      setNewHomework({
                        ...newHomework,
                        durationMinutes: parseInt(e.target.value) || 10,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Assigned Date</label>
                  <Input
                    type="date"
                    value={newHomework.assignedDate || ""}
                    onChange={(e) => setNewHomework({ ...newHomework, assignedDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={newHomework.dueDate || ""}
                    onChange={(e) => setNewHomework({ ...newHomework, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Materials */}
              <div className="mt-4">
                <label className="text-sm font-medium">Materials Needed</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add a material..."
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addMaterial())}
                  />
                  <Button variant="outline" onClick={addMaterial}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(newHomework.materials || []).map((material, idx) => (
                    <Badge key={idx} variant="outline" className="gap-1">
                      {material}
                      <button
                        onClick={() => removeMaterial(idx)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Media Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    Video Demonstration URL
                  </label>
                  <Input
                    placeholder="https://..."
                    value={newHomework.videoUrl || ""}
                    onChange={(e) => setNewHomework({ ...newHomework, videoUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Mic className="h-4 w-4" />
                    Audio Model URL
                  </label>
                  <Input
                    placeholder="https://..."
                    value={newHomework.audioModelUrl || ""}
                    onChange={(e) =>
                      setNewHomework({ ...newHomework, audioModelUrl: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setSelectedTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateHomework}>
              <Home className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Homework List */}
      <div className="space-y-4">
        {filteredHomework.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No homework assignments found. Create a new assignment to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filteredHomework.map((hw) => {
            const areaConfig = GOAL_AREAS.find((a) => a.value === hw.goalArea);
            const statusConfig = STATUS_CONFIG[hw.status];
            const completionRate = getCompletionRate(hw);
            const AreaIcon = areaConfig?.icon || Target;

            return (
              <Card key={hw.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          <AreaIcon className="h-3 w-3 mr-1" />
                          {areaConfig?.label}
                        </Badge>
                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        {completionRate > 0 && (
                          <Badge variant="outline" className="bg-green-50">
                            {completionRate}% Completed
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{hw.title}</CardTitle>
                      <CardDescription className="mt-1">{hw.instructions}</CardDescription>
                    </div>

                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Due: {new Date(hw.dueDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground mt-1">
                        <Clock className="h-4 w-4" />
                        {hw.frequencyPerWeek}x/week, {hw.durationMinutes} min
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="border-t bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Target Skills */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Target Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {hw.targetSkills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Materials */}
                    {hw.materials && hw.materials.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Materials</h4>
                        <div className="flex flex-wrap gap-1">
                          {hw.materials.map((material, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {material}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Media Links */}
                  {(hw.videoUrl || hw.audioModelUrl) && (
                    <div className="flex gap-2 mt-4">
                      {hw.videoUrl && (
                        <a 
                          href={hw.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-8 px-3 border border-slate-200 hover:bg-slate-50"
                        >
                          <Video className="h-3 w-3 mr-1" />
                          Video
                        </a>
                      )}
                      {hw.audioModelUrl && (
                        <a 
                          href={hw.audioModelUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-8 px-3 border border-slate-200 hover:bg-slate-50"
                        >
                          <Mic className="h-3 w-3 mr-1" />
                          Audio
                        </a>
                      )}
                    </div>
                  )}

                  {/* Completion Logs */}
                  {hw.completionLogs && hw.completionLogs.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Recent Practice Logs</h4>
                      <div className="space-y-1">
                        {hw.completionLogs.slice(-5).map((log, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm p-2 bg-white rounded border"
                          >
                            {log.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-muted-foreground">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                            <span>{log.durationMinutes} min</span>
                            {log.accuracy !== undefined && <span>{log.accuracy}% accuracy</span>}
                            {log.parentRating && (
                              <div className="flex items-center">
                                {Array.from({ length: log.parentRating }).map((_, i) => (
                                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            )}
                            {log.notes && (
                              <span className="text-muted-foreground truncate">{log.notes}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parent Notes */}
                  {hw.parentNotes && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="text-sm font-medium flex items-center gap-1 mb-1">
                        <MessageSquare className="h-4 w-4" />
                        Parent Notes
                      </h4>
                      <p className="text-sm">{hw.parentNotes}</p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="border-t flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewHomework(hw)}>
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => generatePrintableVersion(hw)}>
                    <Printer className="h-3 w-3 mr-1" />
                    Print
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleSendToParent(hw.id)}>
                    <Send className="h-3 w-3 mr-1" />
                    Send to Parent
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteHomework(hw.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Preview Modal */}
      {previewHomework && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Parent View Preview</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setPreviewHomework(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">🎯 Speech Practice at Home</h2>
                <p className="text-muted-foreground">For: {learnerName}</p>
              </div>

              <div>
                <h3 className="font-bold text-lg">{previewHomework.title}</h3>
                <Badge className="mt-1">
                  {GOAL_AREAS.find((a) => a.value === previewHomework.goalArea)?.label}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium">📝 What to Do:</h4>
                <p className="mt-1 whitespace-pre-wrap">{previewHomework.instructions}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium">📅 Schedule:</h4>
                  <p>
                    {previewHomework.frequencyPerWeek} times per week
                    <br />
                    {previewHomework.durationMinutes} minutes each session
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">⏰ Due Date:</h4>
                  <p>{new Date(previewHomework.dueDate).toLocaleDateString()}</p>
                </div>
              </div>

              {previewHomework.targetSkills.length > 0 && (
                <div>
                  <h4 className="font-medium">🎯 Skills We&apos;re Working On:</h4>
                  <ul className="list-disc list-inside mt-1">
                    {previewHomework.targetSkills.map((skill, idx) => (
                      <li key={idx}>{skill}</li>
                    ))}
                  </ul>
                </div>
              )}

              {previewHomework.materials && previewHomework.materials.length > 0 && (
                <div>
                  <h4 className="font-medium">📦 Materials Needed:</h4>
                  <ul className="list-disc list-inside mt-1">
                    {previewHomework.materials.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-center pt-4 border-t text-muted-foreground text-sm">
                Questions? Contact your child&apos;s Speech-Language Pathologist
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewHomework(null)}>
                Close
              </Button>
              <Button onClick={() => handleSendToParent(previewHomework.id)}>
                <Send className="h-4 w-4 mr-2" />
                Send to Parent
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ParentHomeworkAssigner;

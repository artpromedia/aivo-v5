"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectItem } from "@/components/ui/Select";
import { Progress } from "@/components/ui/Progress";
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Save,
  FileText,
} from "lucide-react";

// Types matching Prisma schema
type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "MASTERED" | "DISCONTINUED";
type GoalArea =
  | "ARTICULATION"
  | "FLUENCY"
  | "RECEPTIVE_LANGUAGE"
  | "EXPRESSIVE_LANGUAGE"
  | "PRAGMATIC_LANGUAGE"
  | "VOICE"
  | "MIXED";

interface SLPGoal {
  id: string;
  slpProfileId: string;
  goalArea: GoalArea;
  shortTermObjective: string;
  longTermGoal: string;
  baseline: string;
  targetCriteria: string;
  targetDate: string;
  status: GoalStatus;
  currentProgress: number;
  progressHistory: ProgressEntry[];
  iepGoalNumber: string | null;
  strategies: string[];
  accommodations: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProgressEntry {
  date: string;
  progress: number;
  notes: string;
  sessionId?: string;
  trialData?: {
    correct: number;
    total: number;
  };
}

interface SLPGoalTrackerProps {
  learnerId: string;
  profileId: string;
  goals?: SLPGoal[];
  onGoalCreate?: (goal: Partial<SLPGoal>) => Promise<void>;
  onGoalUpdate?: (goalId: string, updates: Partial<SLPGoal>) => Promise<void>;
  onGoalDelete?: (goalId: string) => Promise<void>;
  onProgressUpdate?: (goalId: string, entry: ProgressEntry) => Promise<void>;
}

const GOAL_AREAS: { value: GoalArea; label: string; color: string }[] = [
  { value: "ARTICULATION", label: "Articulation", color: "bg-blue-100 text-blue-800" },
  { value: "FLUENCY", label: "Fluency", color: "bg-purple-100 text-purple-800" },
  { value: "RECEPTIVE_LANGUAGE", label: "Receptive Language", color: "bg-green-100 text-green-800" },
  { value: "EXPRESSIVE_LANGUAGE", label: "Expressive Language", color: "bg-orange-100 text-orange-800" },
  { value: "PRAGMATIC_LANGUAGE", label: "Pragmatic/Social", color: "bg-pink-100 text-pink-800" },
  { value: "VOICE", label: "Voice", color: "bg-cyan-100 text-cyan-800" },
  { value: "MIXED", label: "Mixed", color: "bg-gray-100 text-gray-800" },
];

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; icon: typeof Target }> = {
  NOT_STARTED: { label: "Not Started", color: "bg-gray-100 text-gray-600", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: TrendingUp },
  MASTERED: { label: "Mastered", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  DISCONTINUED: { label: "Discontinued", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

export function SLPGoalTracker({
  learnerId,
  profileId,
  goals: initialGoals = [],
  onGoalCreate,
  onGoalUpdate,
  onGoalDelete,
  onProgressUpdate,
}: SLPGoalTrackerProps) {
  const [goals, setGoals] = useState<SLPGoal[]>(initialGoals);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [filterArea, setFilterArea] = useState<GoalArea | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<GoalStatus | "ALL">("ALL");

  // New goal form state
  const [newGoal, setNewGoal] = useState<Partial<SLPGoal>>({
    goalArea: "ARTICULATION",
    shortTermObjective: "",
    longTermGoal: "",
    baseline: "",
    targetCriteria: "80% accuracy across 3 consecutive sessions",
    targetDate: "",
    status: "NOT_STARTED",
    currentProgress: 0,
    progressHistory: [],
    iepGoalNumber: "",
    strategies: [],
    accommodations: [],
    notes: "",
  });

  // Progress entry form
  const [progressEntry, setProgressEntry] = useState<Partial<ProgressEntry>>({
    date: new Date().toISOString().split("T")[0],
    progress: 0,
    notes: "",
  });
  const [addingProgressForGoal, setAddingProgressForGoal] = useState<string | null>(null);

  // Update goals when prop changes
  useEffect(() => {
    setGoals(initialGoals);
  }, [initialGoals]);

  const toggleExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.shortTermObjective || !newGoal.longTermGoal) return;

    const goalData: Partial<SLPGoal> = {
      ...newGoal,
      slpProfileId: profileId,
      progressHistory: [],
    };

    if (onGoalCreate) {
      await onGoalCreate(goalData);
    } else {
      // Local state update for demo
      const created: SLPGoal = {
        ...goalData,
        id: `goal-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as SLPGoal;
      setGoals((prev) => [...prev, created]);
    }

    setIsCreating(false);
    setNewGoal({
      goalArea: "ARTICULATION",
      shortTermObjective: "",
      longTermGoal: "",
      baseline: "",
      targetCriteria: "80% accuracy across 3 consecutive sessions",
      targetDate: "",
      status: "NOT_STARTED",
      currentProgress: 0,
      progressHistory: [],
      iepGoalNumber: "",
      strategies: [],
      accommodations: [],
      notes: "",
    });
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<SLPGoal>) => {
    if (onGoalUpdate) {
      await onGoalUpdate(goalId, updates);
    } else {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
        )
      );
    }
    setEditingGoalId(null);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    if (onGoalDelete) {
      await onGoalDelete(goalId);
    } else {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    }
  };

  const handleAddProgress = async (goalId: string) => {
    if (!progressEntry.progress && progressEntry.progress !== 0) return;

    const entry: ProgressEntry = {
      date: progressEntry.date || new Date().toISOString().split("T")[0],
      progress: progressEntry.progress || 0,
      notes: progressEntry.notes || "",
    };

    if (onProgressUpdate) {
      await onProgressUpdate(goalId, entry);
    } else {
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id === goalId) {
            const updatedHistory = [...(g.progressHistory || []), entry];
            return {
              ...g,
              progressHistory: updatedHistory,
              currentProgress: entry.progress,
              updatedAt: new Date().toISOString(),
            };
          }
          return g;
        })
      );
    }

    setAddingProgressForGoal(null);
    setProgressEntry({
      date: new Date().toISOString().split("T")[0],
      progress: 0,
      notes: "",
    });
  };

  const filteredGoals = goals.filter((goal) => {
    if (filterArea !== "ALL" && goal.goalArea !== filterArea) return false;
    if (filterStatus !== "ALL" && goal.status !== filterStatus) return false;
    return true;
  });

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-yellow-500";
    if (progress >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const calculateTrend = (history: ProgressEntry[]): "up" | "down" | "stable" => {
    if (history.length < 2) return "stable";
    const recent = history.slice(-3);
    const first = recent[0]?.progress || 0;
    const last = recent[recent.length - 1]?.progress || 0;
    if (last - first > 5) return "up";
    if (first - last > 5) return "down";
    return "stable";
  };

  const getSummaryStats = () => {
    const total = goals.length;
    const inProgress = goals.filter((g) => g.status === "IN_PROGRESS").length;
    const mastered = goals.filter((g) => g.status === "MASTERED").length;
    const avgProgress =
      total > 0 ? Math.round(goals.reduce((sum, g) => sum + g.currentProgress, 0) / total) : 0;
    return { total, inProgress, mastered, avgProgress };
  };

  const stats = getSummaryStats();

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Goals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.mastered}</div>
            <div className="text-sm text-muted-foreground">Mastered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.avgProgress}%</div>
            <div className="text-sm text-muted-foreground">Avg Progress</div>
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
                onValueChange={(v: string) => setFilterStatus(v as GoalStatus | "ALL")}
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
                Add Goal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Goal Form */}
      {isCreating && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Create New IEP Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Goal Area *</label>
                <Select
                  value={newGoal.goalArea}
                  onValueChange={(v: string) => setNewGoal({ ...newGoal, goalArea: v as GoalArea })}
                >
                  {GOAL_AREAS.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">IEP Goal Number</label>
                <Input
                  placeholder="e.g., 1.1, 2.3"
                  value={newGoal.iepGoalNumber || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoal({ ...newGoal, iepGoalNumber: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Long-Term Goal *</label>
              <Textarea
                placeholder="By [date], [student] will [measurable skill] given [conditions] with [accuracy/criteria]..."
                value={newGoal.longTermGoal}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewGoal({ ...newGoal, longTermGoal: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Short-Term Objective *</label>
              <Textarea
                placeholder="Specific, measurable objective that leads to the long-term goal..."
                value={newGoal.shortTermObjective}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewGoal({ ...newGoal, shortTermObjective: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Baseline Performance</label>
                <Input
                  placeholder="e.g., 20% accuracy in conversation"
                  value={newGoal.baseline || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoal({ ...newGoal, baseline: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Target Criteria</label>
                <Input
                  placeholder="e.g., 80% across 3 sessions"
                  value={newGoal.targetCriteria || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoal({ ...newGoal, targetCriteria: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Target Date</label>
                <Input
                  type="date"
                  value={newGoal.targetDate || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Initial Status</label>
                <Select
                  value={newGoal.status}
                  onValueChange={(v: string) => setNewGoal({ ...newGoal, status: v as GoalStatus })}
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes / Strategies</label>
              <Textarea
                placeholder="Additional notes, strategies, or accommodations..."
                value={newGoal.notes || ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewGoal({ ...newGoal, notes: e.target.value })}
                rows={2}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGoal}>
              <Save className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No goals found. Create a new goal to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filteredGoals.map((goal) => {
            const areaConfig = GOAL_AREAS.find((a) => a.value === goal.goalArea);
            const statusConfig = STATUS_CONFIG[goal.status];
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedGoals.has(goal.id);
            const trend = calculateTrend(goal.progressHistory || []);

            return (
              <Card key={goal.id} className="overflow-hidden">
                <div
                  className="cursor-pointer hover:bg-muted/50 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4"
                  onClick={() => toggleExpanded(goal.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={areaConfig?.color}>{areaConfig?.label}</Badge>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {goal.iepGoalNumber && (
                          <Badge variant="outline">IEP #{goal.iepGoalNumber}</Badge>
                        )}
                        {trend === "up" && (
                          <Badge className="bg-green-100 text-green-700">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Improving
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">{goal.shortTermObjective}</CardTitle>
                      {goal.longTermGoal && (
                        <CardDescription className="mt-1 line-clamp-2">
                          Long-term: {goal.longTermGoal}
                        </CardDescription>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{goal.currentProgress}%</div>
                        <div className="text-xs text-muted-foreground">Progress</div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <Progress value={goal.currentProgress} className="h-2" />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>Baseline: {goal.baseline || "N/A"}</span>
                      <span>Target: {goal.targetCriteria || "80%"}</span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="border-t bg-muted/20 space-y-4">
                    {/* Goal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Goal Details</h4>
                        <dl className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Target Date:</dt>
                            <dd>
                              {goal.targetDate
                                ? new Date(goal.targetDate).toLocaleDateString()
                                : "Not set"}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Created:</dt>
                            <dd>{new Date(goal.createdAt).toLocaleDateString()}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Last Updated:</dt>
                            <dd>{new Date(goal.updatedAt).toLocaleDateString()}</dd>
                          </div>
                        </dl>
                      </div>

                      {goal.notes && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Notes</h4>
                          <p className="text-sm text-muted-foreground">{goal.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Progress History */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Progress History
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddingProgressForGoal(goal.id);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Progress
                        </Button>
                      </div>

                      {addingProgressForGoal === goal.id && (
                        <div
                          className="bg-white p-4 rounded-lg border mb-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium">Date</label>
                              <Input
                                type="date"
                                value={progressEntry.date}
                                onChange={(e) =>
                                  setProgressEntry({ ...progressEntry, date: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Progress (%)</label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={progressEntry.progress}
                                onChange={(e) =>
                                  setProgressEntry({
                                    ...progressEntry,
                                    progress: parseInt(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Notes</label>
                              <Input
                                placeholder="Session notes..."
                                value={progressEntry.notes}
                                onChange={(e) =>
                                  setProgressEntry({ ...progressEntry, notes: e.target.value })
                                }
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAddingProgressForGoal(null)}
                            >
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => handleAddProgress(goal.id)}>
                              Save Progress
                            </Button>
                          </div>
                        </div>
                      )}

                      {goal.progressHistory && goal.progressHistory.length > 0 ? (
                        <div className="space-y-2">
                          {goal.progressHistory
                            .slice()
                            .reverse()
                            .slice(0, 5)
                            .map((entry, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-4 p-2 bg-white rounded border text-sm"
                              >
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(entry.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2 font-medium">
                                  <div
                                    className={`w-3 h-3 rounded-full ${getProgressColor(
                                      entry.progress
                                    )}`}
                                  />
                                  {entry.progress}%
                                </div>
                                {entry.notes && (
                                  <div className="flex-1 text-muted-foreground truncate">
                                    {entry.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          {goal.progressHistory.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center">
                              + {goal.progressHistory.length - 5} more entries
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No progress entries yet
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGoalId(goal.id);
                        }}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Export goal report
                          console.log("Export goal:", goal);
                        }}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGoal(goal.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>

                    {/* Quick Status Update */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span className="text-sm font-medium">Quick Status:</span>
                      {(Object.keys(STATUS_CONFIG) as GoalStatus[]).map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={goal.status === status ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateGoal(goal.id, { status });
                          }}
                        >
                          {STATUS_CONFIG[status].label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SLPGoalTracker;

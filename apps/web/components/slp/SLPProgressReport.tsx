"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectItem } from "@/components/ui/Select";
import { Progress } from "@/components/ui/Progress";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Mic,
  MessageSquare,
  BookOpen,
  Send,
  Eye,
  AlertCircle,
} from "lucide-react";

// Types
type GoalArea =
  | "ARTICULATION"
  | "FLUENCY"
  | "RECEPTIVE_LANGUAGE"
  | "EXPRESSIVE_LANGUAGE"
  | "PRAGMATIC_LANGUAGE"
  | "VOICE"
  | "MIXED";

type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "MASTERED" | "DISCONTINUED";

interface SLPGoal {
  id: string;
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
}

interface ProgressEntry {
  date: string;
  progress: number;
  notes: string;
}

interface SLPSession {
  id: string;
  sessionDate: string;
  sessionType: GoalArea;
  durationMinutes: number;
  activities: string[];
  progressNotes: string;
  goalsAddressed: string[];
}

interface ArticulationTarget {
  phoneme: string;
  position: string;
  currentAccuracy: number;
}

interface SLPProfile {
  id: string;
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  iepStartDate: string;
  iepEndDate: string;
  serviceMinutesPerWeek: number;
  sessionFrequency: string;
}

interface SLPProgressReportProps {
  learnerId: string;
  learnerName: string;
  dateOfBirth?: string;
  grade?: string;
  school?: string;
  profile: SLPProfile;
  goals: SLPGoal[];
  sessions: SLPSession[];
  articulationTargets?: ArticulationTarget[];
  reportingPeriod?: {
    start: string;
    end: string;
  };
  therapistName?: string;
  therapistCredentials?: string;
  onExport?: (format: "pdf" | "docx") => Promise<void>;
  onSendToParent?: () => Promise<void>;
}

const GOAL_AREAS_CONFIG: Record<GoalArea, { label: string; icon: typeof Target; color: string }> = {
  ARTICULATION: { label: "Articulation", icon: Mic, color: "bg-blue-100 text-blue-800" },
  FLUENCY: { label: "Fluency", icon: Activity, color: "bg-theme-secondary/10 text-theme-secondary-dark" },
  RECEPTIVE_LANGUAGE: { label: "Receptive Language", icon: BookOpen, color: "bg-green-100 text-green-800" },
  EXPRESSIVE_LANGUAGE: { label: "Expressive Language", icon: MessageSquare, color: "bg-orange-100 text-orange-800" },
  PRAGMATIC_LANGUAGE: { label: "Pragmatic Language", icon: Target, color: "bg-pink-100 text-pink-800" },
  VOICE: { label: "Voice", icon: Mic, color: "bg-cyan-100 text-cyan-800" },
  MIXED: { label: "Mixed", icon: Target, color: "bg-gray-100 text-gray-800" },
};

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  NOT_STARTED: { label: "Not Started", color: "bg-gray-100 text-gray-600" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  MASTERED: { label: "Mastered", color: "bg-green-100 text-green-700" },
  DISCONTINUED: { label: "Discontinued", color: "bg-red-100 text-red-700" },
};

export function SLPProgressReport({
  learnerId,
  learnerName,
  dateOfBirth,
  grade,
  school,
  profile,
  goals,
  sessions,
  articulationTargets = [],
  reportingPeriod,
  therapistName = "Speech-Language Pathologist",
  therapistCredentials = "M.A., CCC-SLP",
  onExport,
  onSendToParent,
}: SLPProgressReportProps) {
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Calculate reporting period
  const period = useMemo(() => {
    if (reportingPeriod) return reportingPeriod;
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3); // Default to last 3 months
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }, [reportingPeriod]);

  // Filter sessions in reporting period
  const periodSessions = useMemo(() => {
    return sessions.filter((s) => {
      const sessionDate = new Date(s.sessionDate);
      return sessionDate >= new Date(period.start) && sessionDate <= new Date(period.end);
    });
  }, [sessions, period]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSessions = periodSessions.length;
    const totalMinutes = periodSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const goalsInProgress = goals.filter((g) => g.status === "IN_PROGRESS").length;
    const goalsMastered = goals.filter((g) => g.status === "MASTERED").length;
    const avgProgress =
      goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + g.currentProgress, 0) / goals.length)
        : 0;

    // Calculate trend for each goal
    const goalsWithTrend = goals.map((goal) => {
      const history = goal.progressHistory || [];
      const periodHistory = history.filter((h) => {
        const date = new Date(h.date);
        return date >= new Date(period.start) && date <= new Date(period.end);
      });

      let trend: "up" | "down" | "stable" = "stable";
      if (periodHistory.length >= 2) {
        const first = periodHistory[0].progress;
        const last = periodHistory[periodHistory.length - 1].progress;
        if (last - first > 5) trend = "up";
        else if (first - last > 5) trend = "down";
      }

      return { ...goal, trend };
    });

    return {
      totalSessions,
      totalMinutes,
      goalsInProgress,
      goalsMastered,
      avgProgress,
      goalsWithTrend,
    };
  }, [goals, periodSessions, period]);

  // Group goals by area
  const goalsByArea = useMemo(() => {
    const grouped: Record<GoalArea, SLPGoal[]> = {
      ARTICULATION: [],
      FLUENCY: [],
      RECEPTIVE_LANGUAGE: [],
      EXPRESSIVE_LANGUAGE: [],
      PRAGMATIC_LANGUAGE: [],
      VOICE: [],
      MIXED: [],
    };
    goals.forEach((goal) => {
      grouped[goal.goalArea].push(goal);
    });
    return grouped;
  }, [goals]);

  const handleExport = async (format: "pdf" | "docx") => {
    if (onExport) {
      await onExport(format);
    } else {
      console.log(`Exporting as ${format}...`);
      alert(`Report would be exported as ${format.toUpperCase()}`);
    }
  };

  const handleSendToParent = async () => {
    if (onSendToParent) {
      await onSendToParent();
    } else {
      alert("Progress report sent to parent/guardian!");
    }
  };

  const formatDateRange = (start: string, end: string) => {
    return `${new Date(start).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })} - ${new Date(end).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Speech-Language Progress Report
              </CardTitle>
              <CardDescription>
                Reporting Period: {formatDateRange(period.start, period.end)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? "Edit" : "Preview"}
              </Button>
              <Button variant="outline" onClick={() => handleExport("pdf")}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={handleSendToParent}>
                <Send className="h-4 w-4 mr-2" />
                Send to Parent
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Student Information */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Student Name</label>
              <p className="font-medium">{learnerName}</p>
            </div>
            {dateOfBirth && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <p>{new Date(dateOfBirth).toLocaleDateString()}</p>
              </div>
            )}
            {grade && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Grade</label>
                <p>{grade}</p>
              </div>
            )}
            {school && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">School</label>
                <p>{school}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Primary Diagnosis</label>
              <p>{profile.primaryDiagnosis || "Not specified"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Service Frequency</label>
              <p>
                {profile.serviceMinutesPerWeek} min/week ({profile.sessionFrequency})
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">IEP Period</label>
              <p>
                {new Date(profile.iepStartDate).toLocaleDateString()} -{" "}
                {new Date(profile.iepEndDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalSessions}</div>
            <div className="text-sm text-muted-foreground">Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-theme-primary">{stats.totalMinutes}</div>
            <div className="text-sm text-muted-foreground">Total Minutes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.goalsInProgress}</div>
            <div className="text-sm text-muted-foreground">Goals In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.goalsMastered}</div>
            <div className="text-sm text-muted-foreground">Goals Mastered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-cyan-600">{stats.avgProgress}%</div>
            <div className="text-sm text-muted-foreground">Avg. Progress</div>
          </CardContent>
        </Card>
      </div>

      {/* IEP Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            IEP Goal Progress
          </CardTitle>
          <CardDescription>Progress toward annual IEP goals and short-term objectives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(goalsByArea).map(([area, areaGoals]) => {
            if (areaGoals.length === 0) return null;
            const config = GOAL_AREAS_CONFIG[area as GoalArea];
            const AreaIcon = config.icon;

            return (
              <div key={area} className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <AreaIcon className="h-4 w-4" />
                  {config.label}
                </h3>
                <div className="space-y-4 pl-6 border-l-2 border-muted">
                  {areaGoals.map((goal) => {
                    const goalWithTrend = stats.goalsWithTrend.find((g) => g.id === goal.id);
                    const trend = goalWithTrend?.trend || "stable";

                    return (
                      <div key={goal.id} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {goal.iepGoalNumber && (
                                <Badge variant="outline">Goal #{goal.iepGoalNumber}</Badge>
                              )}
                              <Badge className={STATUS_CONFIG[goal.status].color}>
                                {STATUS_CONFIG[goal.status].label}
                              </Badge>
                              {trend === "up" && (
                                <Badge className="bg-green-100 text-green-700">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Improving
                                </Badge>
                              )}
                              {trend === "down" && (
                                <Badge className="bg-red-100 text-red-700">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Declining
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium">{goal.longTermGoal}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              <strong>Objective:</strong> {goal.shortTermObjective}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{goal.currentProgress}%</div>
                            <div className="text-xs text-muted-foreground">
                              Target: {goal.targetCriteria}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress value={goal.currentProgress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Baseline: {goal.baseline}</span>
                            <span>Due: {new Date(goal.targetDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Articulation Targets (if applicable) */}
      {articulationTargets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Articulation Target Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {articulationTargets.map((target, idx) => (
                <div key={idx} className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">/{target.phoneme}/</div>
                  <div className="text-sm text-muted-foreground capitalize">{target.position}</div>
                  <div className="mt-2">
                    <Progress value={target.currentAccuracy} className="h-2" />
                    <div className="text-sm font-medium mt-1">{target.currentAccuracy}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {periodSessions.slice(0, 10).map((session) => (
              <div key={session.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {new Date(session.sessionDate).toLocaleDateString()}
                    </span>
                    <Badge className={GOAL_AREAS_CONFIG[session.sessionType].color}>
                      {GOAL_AREAS_CONFIG[session.sessionType].label}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {session.durationMinutes} minutes
                  </span>
                </div>
                <p className="text-sm">{session.progressNotes}</p>
                {session.activities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {session.activities.map((activity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {periodSessions.length > 10 && (
              <p className="text-sm text-center text-muted-foreground">
                + {periodSessions.length - 10} more sessions
              </p>
            )}
            {periodSessions.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No sessions recorded in this reporting period.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Therapist Notes & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Therapist Summary & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Summary of Progress</label>
            <Textarea
              placeholder="Summarize the student's overall progress during this reporting period..."
              value={additionalNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdditionalNotes(e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Recommendations</label>
            <Textarea
              placeholder="Recommendations for continued therapy, home practice, or modifications..."
              value={recommendations}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRecommendations(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Signature Section */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="border-b border-gray-400 pb-2 mb-2">
                <span className="text-muted-foreground">SLP Signature</span>
              </div>
              <p className="font-medium">{therapistName}</p>
              <p className="text-sm text-muted-foreground">{therapistCredentials}</p>
              <p className="text-sm text-muted-foreground">
                Date: {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-2">
              <div className="border-b border-gray-400 pb-2 mb-2">
                <span className="text-muted-foreground">Parent/Guardian Acknowledgment</span>
              </div>
              <p className="text-sm text-muted-foreground">
                I have received and reviewed this progress report.
              </p>
              <p className="text-sm text-muted-foreground">Signature: ________________</p>
              <p className="text-sm text-muted-foreground">Date: ________________</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Report generated: {new Date().toLocaleString()}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport("docx")}>
                <Download className="h-4 w-4 mr-2" />
                Download Word
              </Button>
              <Button variant="outline" onClick={() => handleExport("pdf")}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleSendToParent}>
                <Send className="h-4 w-4 mr-2" />
                Send to Parent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SLPProgressReport;

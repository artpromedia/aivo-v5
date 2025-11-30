"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  TrendingUp,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ParentAssignmentView, type ParentDashboardData } from "@/components/adhd";

// Mock data for parent dashboard
const mockParentData: ParentDashboardData = {
  learnerName: "Alex Johnson",
  learnerId: "learner-1",
  upcomingAssignments: [
    {
      id: "1",
      title: "Math Chapter 5 Review",
      className: "Mathematics",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      urgency: "HIGH",
      status: "IN_PROGRESS",
      hasBreakdown: true,
      completedSteps: 3,
      totalSteps: 5,
    },
    {
      id: "2",
      title: "Science Lab Report",
      className: "Science",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      urgency: "MEDIUM",
      status: "NOT_STARTED",
      hasBreakdown: false,
    },
    {
      id: "3",
      title: "History Essay Outline",
      className: "History",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      urgency: "CRITICAL",
      status: "IN_PROGRESS",
      hasBreakdown: true,
      completedSteps: 1,
      totalSteps: 4,
    },
  ],
  recentActivity: [
    {
      type: "ASSIGNMENT_COMPLETED",
      description: "Completed 'Reading Response Ch. 4'",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: "POMODORO_SESSION",
      description: "Completed 2 Pomodoro focus sessions",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: "BINDER_CHECK",
      description: "Completed binder organization check",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  weeklyStats: {
    assignmentsCompleted: 5,
    assignmentsDue: 8,
    pomodorosCompleted: 12,
    totalFocusMinutes: 300,
    binderCheckIns: 4,
  },
  reminders: [
    {
      id: "rem-1",
      type: "ASSIGNMENT_DUE",
      message: "History Essay Outline due tomorrow",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      acknowledged: false,
    },
    {
      id: "rem-2",
      type: "STUDY_SESSION",
      message: "Daily study goal not yet met (45/60 min)",
      acknowledged: false,
    },
  ],
};

// Additional data for strategy updates (not in ParentDashboardData)
const interventionUpdates = [
  {
    id: "int-1",
    strategy: "Visual Timer",
    lastUpdate: "2024-01-28",
    effectiveness: "EFFECTIVE",
    notes: "Student is responding well to visual cues during homework time.",
  },
  {
    id: "int-2",
    strategy: "Task Launch Routine",
    lastUpdate: "2024-01-27",
    effectiveness: "SOMEWHAT_EFFECTIVE",
    notes: "Still needs some prompting but showing improvement.",
  },
];

export default function ParentViewPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";

  const [activeTab, setActiveTab] = useState("overview");

  // Calculate stats
  const completionRate = Math.round(
    (mockParentData.weeklyStats.assignmentsCompleted / mockParentData.weeklyStats.assignmentsDue) * 100
  );
  const studyGoalMinutes = 60;
  const studyMinutesToday = 45;
  const studyProgress = Math.round((studyMinutesToday / studyGoalMinutes) * 100);
  const focusStreak = 3;

  const urgentCount = mockParentData.upcomingAssignments.filter(
    (a) => a.urgency === "CRITICAL" || a.urgency === "HIGH"
  ).length;

  // Weekly progress data
  const recentProgress = {
    monday: 45,
    tuesday: 60,
    wednesday: 30,
    thursday: 55,
    friday: 0,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Parent Dashboard</h1>
            <p className="text-muted-foreground">
              Track {mockParentData.learnerName}&apos;s progress and assignments
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Bell className="h-4 w-4 mr-2" />
          Notification Settings
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Weekly Completion</CardDescription>
            <CardTitle className="text-3xl">
              {mockParentData.weeklyStats.assignmentsCompleted}/{mockParentData.weeklyStats.assignmentsDue}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completionRate}% complete this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Study Time Today</CardDescription>
            <CardTitle className="text-3xl">
              {studyMinutesToday} min
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={studyProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Goal: {studyGoalMinutes} minutes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Focus Streak</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {focusStreak} days
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Consecutive days meeting study goal
            </p>
          </CardContent>
        </Card>
        <Card className={urgentCount > 0 ? "border-orange-300" : ""}>
          <CardHeader className="pb-2">
            <CardDescription>Needs Attention</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {urgentCount}
              {urgentCount > 0 && <AlertCircle className="h-5 w-5 text-orange-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              High priority assignments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="interventions">Strategies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming Assignments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Upcoming Assignments</CardTitle>
                    <CardDescription>What&apos;s due soon</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockParentData.upcomingAssignments.slice(0, 3).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          assignment.urgency === "CRITICAL"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : assignment.urgency === "HIGH"
                            ? "bg-orange-100 dark:bg-orange-900/30"
                            : "bg-blue-100 dark:bg-blue-900/30"
                        }`}
                      >
                        <BookOpen
                          className={`h-4 w-4 ${
                            assignment.urgency === "CRITICAL"
                              ? "text-red-600"
                              : assignment.urgency === "HIGH"
                              ? "text-orange-600"
                              : "text-blue-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.className} • Due{" "}
                          {new Date(assignment.dueDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          assignment.status === "COMPLETED"
                            ? "default"
                            : assignment.status === "IN_PROGRESS"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {assignment.hasBreakdown && assignment.totalSteps
                          ? `${assignment.completedSteps || 0}/${assignment.totalSteps}`
                          : assignment.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Study Time</CardTitle>
                <CardDescription>Minutes studied each day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-40 gap-2">
                  {Object.entries(recentProgress).map(([day, minutes]) => {
                    const height = (minutes / 60) * 100;
                    const isToday = day === "friday";
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs text-muted-foreground">{minutes}m</span>
                        <div
                          className={`w-full rounded-t transition-all ${
                            isToday ? "bg-purple-500" : "bg-blue-500"
                          }`}
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <span className="text-xs font-medium capitalize">{day.slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intervention Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strategy Updates</CardTitle>
              <CardDescription>Recent updates on learning strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {interventionUpdates.map((update) => (
                <div key={update.id} className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{update.strategy}</p>
                        <Badge
                          variant={
                            update.effectiveness === "VERY_EFFECTIVE" ||
                            update.effectiveness === "EFFECTIVE"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {update.effectiveness.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{update.notes}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(update.lastUpdate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <ParentAssignmentView data={mockParentData} />
        </TabsContent>

        <TabsContent value="interventions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Learning Strategies</CardTitle>
              <CardDescription>
                Strategies being used to support {mockParentData.learnerName}&apos;s learning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {interventionUpdates.map((intervention) => (
                <div
                  key={intervention.id}
                  className="p-4 rounded-lg border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{intervention.strategy}</h4>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(intervention.lastUpdate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        intervention.effectiveness === "VERY_EFFECTIVE"
                          ? "bg-green-100 text-green-800"
                          : intervention.effectiveness === "EFFECTIVE"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {intervention.effectiveness.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-sm">{intervention.notes}</p>
                  <div className="mt-3 pt-3 border-t">
                    <h5 className="text-sm font-medium mb-2">How to Support at Home:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {intervention.strategy === "Visual Timer" && (
                        <>
                          <li>• Use a visual timer during homework sessions</li>
                          <li>• Start with 15-20 minute focus blocks</li>
                          <li>• Celebrate completing timed work sessions</li>
                        </>
                      )}
                      {intervention.strategy === "Task Launch Routine" && (
                        <>
                          <li>• Help them gather materials before starting</li>
                          <li>• Ask them to read the first instruction aloud</li>
                          <li>• Encourage starting within 30 seconds of setup</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

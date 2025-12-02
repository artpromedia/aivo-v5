"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  Bell,
  ChevronRight,
} from "lucide-react";
import { UrgencyBadge, calculateUrgency, getDaysUntilDue, type UrgencyLevel } from "./UrgencyBadge";
import { cn } from "@/lib/utils";

export interface ParentAssignmentSummary {
  id: string;
  title: string;
  className: string;
  dueDate: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "LATE" | "EXCUSED";
  urgency: UrgencyLevel;
  hasBreakdown: boolean;
  completedSteps?: number;
  totalSteps?: number;
}

export interface ParentDashboardData {
  learnerName: string;
  learnerId: string;
  upcomingAssignments: ParentAssignmentSummary[];
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
  }[];
  weeklyStats: {
    assignmentsCompleted: number;
    assignmentsDue: number;
    pomodorosCompleted: number;
    totalFocusMinutes: number;
    binderCheckIns: number;
  };
  reminders: {
    id: string;
    type: string;
    message: string;
    dueDate?: string;
    acknowledged: boolean;
  }[];
}

interface ParentAssignmentViewProps {
  data: ParentDashboardData;
  onViewAssignment?: (assignmentId: string) => void;
  onAcknowledgeReminder?: (reminderId: string) => void;
  className?: string;
}

const statusConfig = {
  NOT_STARTED: { label: "Not Started", color: "bg-gray-100 text-gray-700", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Clock },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  LATE: { label: "Late", color: "bg-red-100 text-red-700", icon: AlertCircle },
  EXCUSED: { label: "Excused", color: "bg-theme-primary/10 text-theme-primary", icon: CheckCircle2 },
};

export function ParentAssignmentView({
  data,
  onViewAssignment,
  onAcknowledgeReminder,
  className,
}: ParentAssignmentViewProps) {
  const { upcomingAssignments, weeklyStats, recentActivity, reminders } = data;

  // Calculate summary stats
  const criticalCount = upcomingAssignments.filter(
    (a) => a.urgency === "CRITICAL" && a.status !== "COMPLETED"
  ).length;
  const overdueCount = upcomingAssignments.filter(
    (a) => getDaysUntilDue(a.dueDate) < 0 && a.status !== "COMPLETED" && a.status !== "EXCUSED"
  ).length;
  const pendingReminders = reminders.filter((r) => !r.acknowledged).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">{data.learnerName}'s Dashboard</h2>
        <p className="text-gray-500">Assignment tracker and progress overview</p>
      </div>

      {/* Alert Banner */}
      {(criticalCount > 0 || overdueCount > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-700">Attention Needed</h3>
            <p className="text-sm text-red-600">
              {criticalCount > 0 && `${criticalCount} critical assignment${criticalCount > 1 ? "s" : ""}`}
              {criticalCount > 0 && overdueCount > 0 && " and "}
              {overdueCount > 0 && `${overdueCount} overdue assignment${overdueCount > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      )}

      {/* Reminders */}
      {pendingReminders > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Reminders</h3>
            <Badge className="bg-orange-100 text-orange-700">{pendingReminders} new</Badge>
          </div>
          <div className="space-y-2">
            {reminders
              .filter((r) => !r.acknowledged)
              .map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-2 bg-orange-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{reminder.message}</p>
                    {reminder.dueDate && (
                      <p className="text-xs text-gray-500">
                        Due: {new Date(reminder.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {onAcknowledgeReminder && (
                    <button
                      onClick={() => onAcknowledgeReminder(reminder.id)}
                      className="text-xs text-orange-600 hover:underline"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Completed"
          value={weeklyStats.assignmentsCompleted}
          total={weeklyStats.assignmentsDue}
          icon={CheckCircle2}
          color="text-green-500"
        />
        <StatCard
          label="Pomodoros"
          value={weeklyStats.pomodorosCompleted}
          icon={Clock}
          color="text-theme-primary"
        />
        <StatCard
          label="Focus Time"
          value={`${Math.round(weeklyStats.totalFocusMinutes / 60)}h`}
          subtext={`${weeklyStats.totalFocusMinutes} min`}
          icon={TrendingUp}
          color="text-blue-500"
        />
        <StatCard
          label="Binder Checks"
          value={weeklyStats.binderCheckIns}
          icon={BookOpen}
          color="text-orange-500"
        />
        <StatCard
          label="Due Soon"
          value={upcomingAssignments.filter((a) => a.status !== "COMPLETED").length}
          icon={Calendar}
          color="text-red-500"
        />
      </div>

      {/* Upcoming Assignments */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Upcoming Assignments</h3>
          </div>
          <Badge variant="outline">
            {upcomingAssignments.filter((a) => a.status !== "COMPLETED").length} pending
          </Badge>
        </div>

        <div className="space-y-2">
          {upcomingAssignments.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No upcoming assignments</p>
          ) : (
            upcomingAssignments
              .sort((a, b) => {
                // Sort by urgency first, then due date
                const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
                  return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                }
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              })
              .map((assignment) => {
                const daysUntilDue = getDaysUntilDue(assignment.dueDate);
                const StatusIcon = statusConfig[assignment.status].icon;

                return (
                  <div
                    key={assignment.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                      assignment.status === "COMPLETED"
                        ? "bg-green-50/50 border-green-200"
                        : assignment.urgency === "CRITICAL"
                        ? "bg-red-50 border-red-200"
                        : "bg-white hover:bg-gray-50 border-gray-200",
                      onViewAssignment && "cursor-pointer"
                    )}
                    onClick={() => onViewAssignment?.(assignment.id)}
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon
                        className={cn(
                          "h-5 w-5",
                          assignment.status === "COMPLETED"
                            ? "text-green-500"
                            : assignment.status === "LATE"
                            ? "text-red-500"
                            : "text-gray-400"
                        )}
                      />
                      <div>
                        <h4
                          className={cn(
                            "font-medium",
                            assignment.status === "COMPLETED" && "line-through text-gray-500"
                          )}
                        >
                          {assignment.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>{assignment.className}</span>
                          <span>•</span>
                          <span>
                            {new Date(assignment.dueDate).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {assignment.hasBreakdown &&
                            assignment.totalSteps !== undefined && (
                              <>
                                <span>•</span>
                                <span>
                                  {assignment.completedSteps}/{assignment.totalSteps} steps
                                </span>
                              </>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {assignment.status !== "COMPLETED" && (
                        <UrgencyBadge
                          urgency={assignment.urgency}
                          daysUntilDue={daysUntilDue}
                          showDays
                          size="sm"
                        />
                      )}
                      {assignment.status === "COMPLETED" && (
                        <Badge className="bg-green-100 text-green-700">Done</Badge>
                      )}
                      {onViewAssignment && (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold">Recent Activity</h3>
        </div>

        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No recent activity</p>
          ) : (
            recentActivity.slice(0, 5).map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-3 text-sm border-l-2 border-gray-200 pl-3"
              >
                <div className="flex-1">
                  <p>{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(activity.timestamp).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.type}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: number | string;
  total?: number;
  subtext?: string;
  icon: typeof CheckCircle2;
  color: string;
}

function StatCard({ label, value, total, subtext, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1">
            {value}
            {total !== undefined && (
              <span className="text-sm font-normal text-gray-400">/{total}</span>
            )}
          </p>
          {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
        </div>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
    </Card>
  );
}

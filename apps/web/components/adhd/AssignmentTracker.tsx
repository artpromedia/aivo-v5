"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Plus,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  BookOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { UrgencyBadge, calculateUrgency, getDaysUntilDue, type UrgencyLevel } from "./UrgencyBadge";
import { cn } from "@/lib/utils";

export type ADHDAssignmentStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "LATE" | "EXCUSED";

export interface ADHDAssignment {
  id: string;
  learnerId: string;
  classId?: string;
  className?: string;
  title: string;
  description?: string;
  dueDate: string;
  status: ADHDAssignmentStatus;
  urgency: UrgencyLevel;
  estimatedMinutes?: number;
  actualMinutes?: number;
  hasProjectBreakdown: boolean;
  projectBreakdownId?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssignmentTrackerProps {
  assignments: ADHDAssignment[];
  onStatusChange: (id: string, status: ADHDAssignmentStatus) => Promise<void>;
  onViewBreakdown?: (assignmentId: string) => void;
  onCreateBreakdown?: (assignmentId: string) => void;
  onAddAssignment?: () => void;
  showFilters?: boolean;
  className?: string;
}

const statusConfig: Record<ADHDAssignmentStatus, { label: string; color: string }> = {
  NOT_STARTED: { label: "Not Started", color: "bg-gray-100 text-gray-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700" },
  LATE: { label: "Late", color: "bg-red-100 text-red-700" },
  EXCUSED: { label: "Excused", color: "bg-purple-100 text-purple-700" },
};

type SortField = "dueDate" | "urgency" | "title" | "status";
type FilterStatus = ADHDAssignmentStatus | "ALL";

export function AssignmentTracker({
  assignments,
  onStatusChange,
  onViewBreakdown,
  onCreateBreakdown,
  onAddAssignment,
  showFilters = true,
  className,
}: AssignmentTrackerProps) {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const urgencyOrder: Record<UrgencyLevel, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  const statusOrder: Record<ADHDAssignmentStatus, number> = {
    LATE: 0,
    NOT_STARTED: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    EXCUSED: 4,
  };

  const filteredAndSortedAssignments = useMemo(() => {
    let result = [...assignments];

    // Filter
    if (filterStatus !== "ALL") {
      result = result.filter((a) => a.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "dueDate":
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "urgency":
          comparison = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status":
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [assignments, filterStatus, sortField, sortAsc]);

  const handleStatusChange = async (id: string, status: ADHDAssignmentStatus) => {
    setUpdatingId(id);
    try {
      await onStatusChange(id, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const SortIcon = sortAsc ? SortAsc : SortDesc;

  // Summary stats
  const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter((a) => a.status === "COMPLETED").length;
    const critical = assignments.filter((a) => a.urgency === "CRITICAL" && a.status !== "COMPLETED").length;
    const overdue = assignments.filter(
      (a) => getDaysUntilDue(a.dueDate) < 0 && a.status !== "COMPLETED" && a.status !== "EXCUSED"
    ).length;
    return { total, completed, critical, overdue };
  }, [assignments]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Assignments</h2>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">{stats.completed}/{stats.total} done</Badge>
            {stats.critical > 0 && (
              <Badge className="bg-red-100 text-red-700">{stats.critical} critical</Badge>
            )}
            {stats.overdue > 0 && (
              <Badge className="bg-red-500 text-white">{stats.overdue} overdue</Badge>
            )}
          </div>
        </div>
        {onAddAssignment && (
          <Button onClick={onAddAssignment} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Assignment
          </Button>
        )}
      </div>

      {/* Filters & Sort */}
      {showFilters && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="ALL">All Status</option>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            {(["dueDate", "urgency", "title", "status"] as SortField[]).map((field) => (
              <Button
                key={field}
                variant={sortField === field ? "default" : "ghost"}
                size="sm"
                onClick={() => toggleSort(field)}
                className="text-xs"
              >
                {field === "dueDate" ? "Due" : field.charAt(0).toUpperCase() + field.slice(1)}
                {sortField === field && <SortIcon className="h-3 w-3 ml-1" />}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Assignment List */}
      <div className="space-y-2">
        {filteredAndSortedAssignments.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No assignments found
          </Card>
        ) : (
          filteredAndSortedAssignments.map((assignment) => {
            const daysUntilDue = getDaysUntilDue(assignment.dueDate);
            const isExpanded = expandedId === assignment.id;
            const isUpdating = updatingId === assignment.id;

            return (
              <Card
                key={assignment.id}
                className={cn(
                  "p-4 transition-all",
                  assignment.status === "COMPLETED" && "opacity-60",
                  assignment.urgency === "CRITICAL" && assignment.status !== "COMPLETED" && "border-red-300 bg-red-50/50"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <Checkbox
                    checked={assignment.status === "COMPLETED"}
                    disabled={isUpdating}
                    onCheckedChange={(checked) =>
                      handleStatusChange(
                        assignment.id,
                        checked ? "COMPLETED" : "NOT_STARTED"
                      )
                    }
                    className="mt-1"
                  />

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3
                          className={cn(
                            "font-medium truncate",
                            assignment.status === "COMPLETED" && "line-through text-gray-500"
                          )}
                        >
                          {assignment.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          {assignment.className && (
                            <>
                              <BookOpen className="h-3.5 w-3.5" />
                              <span>{assignment.className}</span>
                              <span>•</span>
                            </>
                          )}
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(assignment.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {assignment.estimatedMinutes && (
                            <>
                              <span>•</span>
                              <Clock className="h-3.5 w-3.5" />
                              <span>{assignment.estimatedMinutes}min</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <UrgencyBadge
                          urgency={assignment.urgency}
                          daysUntilDue={daysUntilDue}
                          showDays
                          size="sm"
                        />
                        <Badge className={statusConfig[assignment.status].color}>
                          {statusConfig[assignment.status].label}
                        </Badge>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        {assignment.description && (
                          <p className="text-sm text-gray-600">{assignment.description}</p>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Status:</span>
                          <select
                            value={assignment.status}
                            onChange={(e) =>
                              handleStatusChange(assignment.id, e.target.value as ADHDAssignmentStatus)
                            }
                            disabled={isUpdating}
                            className="text-sm border rounded px-2 py-1"
                          >
                            {Object.entries(statusConfig).map(([key, { label }]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Project Breakdown */}
                        <div className="flex items-center gap-2">
                          {assignment.hasProjectBreakdown ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewBreakdown?.(assignment.id)}
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              View Breakdown
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onCreateBreakdown?.(assignment.id)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Create Breakdown
                            </Button>
                          )}
                        </div>

                        {assignment.notes && (
                          <div className="text-sm">
                            <span className="font-medium">Notes: </span>
                            <span className="text-gray-600">{assignment.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expand Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

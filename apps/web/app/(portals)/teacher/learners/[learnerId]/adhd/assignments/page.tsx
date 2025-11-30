"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AssignmentTracker, type ADHDAssignment, type ADHDAssignmentStatus } from "@/components/adhd";

// Mock data - replace with API calls
const mockAssignments: ADHDAssignment[] = [
  {
    id: "1",
    learnerId: "learner-1",
    classId: "class-1",
    className: "Math",
    title: "Chapter 5 Review Problems",
    description: "Complete problems 1-20 from the textbook",
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "IN_PROGRESS",
    urgency: "CRITICAL",
    estimatedMinutes: 45,
    hasProjectBreakdown: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    learnerId: "learner-1",
    classId: "class-2",
    className: "English",
    title: "Essay Draft - Climate Change",
    description: "First draft of the argumentative essay",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "NOT_STARTED",
    urgency: "HIGH",
    estimatedMinutes: 90,
    hasProjectBreakdown: true,
    projectBreakdownId: "breakdown-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    learnerId: "learner-1",
    classId: "class-3",
    className: "Science",
    title: "Lab Report - Photosynthesis",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "NOT_STARTED",
    urgency: "MEDIUM",
    estimatedMinutes: 60,
    hasProjectBreakdown: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    learnerId: "learner-1",
    classId: "class-4",
    className: "History",
    title: "Read Chapter 8",
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "NOT_STARTED",
    urgency: "LOW",
    estimatedMinutes: 30,
    hasProjectBreakdown: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    learnerId: "learner-1",
    classId: "class-1",
    className: "Math",
    title: "Homework Set 12",
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    urgency: "LOW",
    estimatedMinutes: 30,
    actualMinutes: 25,
    hasProjectBreakdown: false,
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function ADHDAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";
  
  const [assignments, setAssignments] = useState<ADHDAssignment[]>(mockAssignments);
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (id: string, status: ADHDAssignmentStatus) => {
    // TODO: API call
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              completedAt: status === "COMPLETED" ? new Date().toISOString() : undefined,
            }
          : a
      )
    );
  };

  const handleViewBreakdown = (assignmentId: string) => {
    router.push(`/teacher/learners/${learnerId}/adhd/projects?assignment=${assignmentId}`);
  };

  const handleCreateBreakdown = (assignmentId: string) => {
    router.push(`/teacher/learners/${learnerId}/adhd/projects?assignment=${assignmentId}&create=true`);
  };

  const handleAddAssignment = () => {
    // TODO: Open add assignment modal
    console.log("Add assignment");
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
            <h1 className="text-2xl font-bold">Assignment Tracker</h1>
            <p className="text-muted-foreground">
              Track assignments with color-coded urgency levels
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsLoading(true)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Assignment Tracker Component */}
      <AssignmentTracker
        assignments={assignments}
        onStatusChange={handleStatusChange}
        onViewBreakdown={handleViewBreakdown}
        onCreateBreakdown={handleCreateBreakdown}
        onAddAssignment={handleAddAssignment}
      />
    </div>
  );
}

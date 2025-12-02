"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  ProjectBreakdownGenerator,
  ProjectStepChecklist,
  type ProjectBreakdown,
  type ProjectStep,
} from "@/components/adhd";

// Mock data
const mockBreakdowns: ProjectBreakdown[] = [
  {
    id: "breakdown-1",
    assignmentId: "2",
    assignmentTitle: "Essay Draft - Climate Change",
    totalSteps: 5,
    completedSteps: 2,
    aiGenerated: true,
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Research and gather sources",
        description: "Find at least 3 credible sources about climate change",
        estimatedMinutes: 30,
        suggestedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: true,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Create outline",
        description: "Write thesis statement and outline main arguments",
        estimatedMinutes: 20,
        suggestedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: true,
        completedAt: new Date().toISOString(),
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Write introduction paragraph",
        description: "Hook, background, thesis statement",
        estimatedMinutes: 20,
        suggestedDate: new Date().toISOString(),
        isCompleted: false,
      },
      {
        id: "step-4",
        stepNumber: 4,
        title: "Write body paragraphs",
        description: "3 paragraphs with evidence and analysis",
        estimatedMinutes: 45,
        suggestedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
      },
      {
        id: "step-5",
        stepNumber: 5,
        title: "Write conclusion and revise",
        description: "Summarize arguments and proofread",
        estimatedMinutes: 25,
        suggestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
      },
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockAssignments = [
  {
    id: "1",
    title: "Chapter 5 Review Problems",
    description: "Complete problems 1-20 from the textbook",
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    title: "Essay Draft - Climate Change",
    description: "First draft of the argumentative essay",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "Lab Report - Photosynthesis",
    description: "Complete lab report with data analysis",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function ADHDProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const learnerId = (params?.learnerId as string) || "";
  
  const assignmentId = searchParams?.get("assignment") || null;
  const createNew = searchParams?.get("create") === "true";

  const [breakdowns, setBreakdowns] = useState<ProjectBreakdown[]>(mockBreakdowns);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(assignmentId);

  const currentBreakdown = breakdowns.find(
    (b) => b.assignmentId === selectedAssignment
  );
  const assignment = mockAssignments.find((a) => a.id === selectedAssignment);

  const handleGenerate = async (
    assignmentId: string,
    params: { assignmentTitle: string; description?: string; dueDate: string }
  ): Promise<ProjectBreakdown> => {
    // TODO: API call to generate breakdown
    const newBreakdown: ProjectBreakdown = {
      id: `breakdown-${Date.now()}`,
      assignmentId,
      assignmentTitle: params.assignmentTitle,
      totalSteps: 4,
      completedSteps: 0,
      aiGenerated: true,
      steps: [
        {
          id: `step-${Date.now()}-1`,
          stepNumber: 1,
          title: "Review assignment requirements",
          estimatedMinutes: 10,
          isCompleted: false,
        },
        {
          id: `step-${Date.now()}-2`,
          stepNumber: 2,
          title: "Gather materials and resources",
          estimatedMinutes: 15,
          isCompleted: false,
        },
        {
          id: `step-${Date.now()}-3`,
          stepNumber: 3,
          title: "Complete main work",
          estimatedMinutes: 30,
          isCompleted: false,
        },
        {
          id: `step-${Date.now()}-4`,
          stepNumber: 4,
          title: "Review and submit",
          estimatedMinutes: 10,
          isCompleted: false,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBreakdowns((prev) => [...prev, newBreakdown]);
    return newBreakdown;
  };

  const handleSave = async (breakdown: Partial<ProjectBreakdown>) => {
    // TODO: API call to save breakdown
    setBreakdowns((prev) =>
      prev.map((b) => (b.id === breakdown.id ? { ...b, ...breakdown } as ProjectBreakdown : b))
    );
  };

  const handleStepToggle = async (stepId: string, completed: boolean) => {
    // TODO: API call
    if (!currentBreakdown) return;
    
    setBreakdowns((prev) =>
      prev.map((b) => {
        if (b.id !== currentBreakdown.id) return b;
        const updatedSteps = b.steps.map((s) =>
          s.id === stepId
            ? { ...s, isCompleted: completed, completedAt: completed ? new Date().toISOString() : undefined }
            : s
        );
        return {
          ...b,
          steps: updatedSteps,
          completedSteps: updatedSteps.filter((s) => s.isCompleted).length,
        };
      })
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Project Breakdowns</h1>
          <p className="text-muted-foreground">
            Break down large assignments into manageable steps with AI assistance
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Assignment List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Assignment</CardTitle>
            <CardDescription>Choose an assignment to break down</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockAssignments.map((a) => {
              const hasBreakdown = breakdowns.some((b) => b.assignmentId === a.id);
              return (
                <div
                  key={a.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedAssignment === a.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedAssignment(a.id)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{a.title}</h4>
                    {hasBreakdown && (
                      <Sparkles className="h-4 w-4 text-theme-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Due: {new Date(a.dueDate).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Breakdown Generator / Viewer */}
        <div className="lg:col-span-2">
          {selectedAssignment && assignment ? (
            <ProjectBreakdownGenerator
              assignmentId={selectedAssignment}
              assignmentTitle={assignment.title}
              assignmentDescription={assignment.description}
              dueDate={assignment.dueDate}
              existingBreakdown={currentBreakdown}
              onGenerate={handleGenerate}
              onSave={handleSave}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-muted-foreground">
                  Select an assignment to view or create a breakdown
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step Checklist */}
          {currentBreakdown && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Step Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectStepChecklist
                  steps={currentBreakdown.steps}
                  onToggleComplete={handleStepToggle}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DailyPlanBuilder, type DailyPlan } from "@/components/adhd";

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// Mock data
const mockPlans: Record<string, DailyPlan> = {
  [formatDate(new Date())]: {
    id: "plan-today",
    learnerId: "learner-1",
    date: formatDate(new Date()),
    timeBlocks: [
      {
        id: "block-1",
        startTime: "08:00",
        endTime: "08:30",
        title: "Morning review",
        category: "STUDY",
        isCompleted: true,
      },
      {
        id: "block-2",
        startTime: "15:30",
        endTime: "16:00",
        title: "Math homework",
        category: "HOMEWORK",
        isCompleted: false,
        assignmentId: "1",
      },
      {
        id: "block-3",
        startTime: "16:00",
        endTime: "16:15",
        title: "Snack break",
        category: "BREAK",
        isCompleted: false,
      },
      {
        id: "block-4",
        startTime: "16:15",
        endTime: "17:00",
        title: "Essay writing",
        category: "PROJECT",
        isCompleted: false,
        assignmentId: "2",
      },
    ],
    aiGenerated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export default function ADHDPlannerPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plans, setPlans] = useState<Record<string, DailyPlan>>(mockPlans);

  const dateKey = formatDate(selectedDate);
  const currentPlan = plans[dateKey];

  const handlePreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleGeneratePlan = async (date: string): Promise<DailyPlan> => {
    // TODO: API call to AI to generate plan
    const newPlan: DailyPlan = {
      id: `plan-${Date.now()}`,
      learnerId,
      date,
      timeBlocks: [
        {
          id: `block-${Date.now()}-1`,
          startTime: "15:30",
          endTime: "16:00",
          title: "Homework time",
          category: "HOMEWORK",
          isCompleted: false,
        },
        {
          id: `block-${Date.now()}-2`,
          startTime: "16:00",
          endTime: "16:15",
          title: "Break",
          category: "BREAK",
          isCompleted: false,
        },
        {
          id: `block-${Date.now()}-3`,
          startTime: "16:15",
          endTime: "17:00",
          title: "Study session",
          category: "STUDY",
          isCompleted: false,
        },
      ],
      aiGenerated: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPlans((prev) => ({ ...prev, [date]: newPlan }));
    return newPlan;
  };

  const handleSavePlan = async (plan: Partial<DailyPlan>) => {
    // TODO: API call to save plan
    if (plan.date) {
      setPlans((prev) => ({
        ...prev,
        [plan.date as string]: { ...prev[plan.date as string], ...plan } as DailyPlan,
      }));
    }
  };

  const handleBlockComplete = async (blockId: string, completed: boolean) => {
    // TODO: API call
    if (!currentPlan) return;
    setPlans((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        timeBlocks: prev[dateKey].timeBlocks.map((b) =>
          b.id === blockId ? { ...b, isCompleted: completed } : b
        ),
      },
    }));
  };

  const isToday = formatDate(new Date()) === dateKey;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Daily Planner</h1>
            <p className="text-muted-foreground">
              Build your daily schedule with visual time blocks
            </p>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {!isToday && (
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Today
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleNextDay}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Week at a Glance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + i);
              const key = formatDate(date);
              const hasPlan = !!plans[key];
              const isSelected = key === dateKey;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-1 p-2 rounded-lg text-center transition-all ${
                    isSelected
                      ? "bg-blue-500 text-white"
                      : hasPlan
                      ? "bg-green-100 hover:bg-green-200 dark:bg-green-900/30"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800"
                  }`}
                >
                  <div className="text-xs font-medium">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-lg font-bold">{date.getDate()}</div>
                  {hasPlan && !isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mx-auto mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Plan Builder */}
      <DailyPlanBuilder
        date={dateKey}
        existingPlan={currentPlan}
        onGeneratePlan={handleGeneratePlan}
        onSavePlan={handleSavePlan}
        onBlockComplete={handleBlockComplete}
      />
    </div>
  );
}

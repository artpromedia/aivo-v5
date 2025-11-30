"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  StudySessionTimer,
  type StudySession,
  type StudyInterval,
  type StudyTechnique,
  type PomodoroSettings,
} from "@/components/adhd";

// Mock data for study history
const mockStudyHistory: StudySession[] = [
  {
    id: "session-1",
    learnerId: "learner-1",
    date: new Date().toISOString().split("T")[0],
    technique: "POMODORO",
    pomodoroSettings: {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
    },
    intervals: [
      { startTime: "15:00", endTime: "15:25", duration: 25 * 60, type: "FOCUS", completed: true },
      { startTime: "15:25", endTime: "15:30", duration: 5 * 60, type: "SHORT_BREAK", completed: true },
      { startTime: "15:30", endTime: "15:55", duration: 25 * 60, type: "FOCUS", completed: true },
    ],
    totalFocusMinutes: 50,
    totalBreakMinutes: 5,
    sessionsCompleted: 2,
    isActive: false,
  },
  {
    id: "session-2",
    learnerId: "learner-1",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    technique: "POMODORO",
    pomodoroSettings: {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
    },
    intervals: [
      { startTime: "16:00", endTime: "16:25", duration: 25 * 60, type: "FOCUS", completed: true },
      { startTime: "16:25", endTime: "16:30", duration: 5 * 60, type: "SHORT_BREAK", completed: true },
      { startTime: "16:30", endTime: "16:55", duration: 25 * 60, type: "FOCUS", completed: true },
      { startTime: "16:55", endTime: "17:00", duration: 5 * 60, type: "SHORT_BREAK", completed: true },
      { startTime: "17:00", endTime: "17:25", duration: 25 * 60, type: "FOCUS", completed: true },
      { startTime: "17:25", endTime: "17:30", duration: 5 * 60, type: "SHORT_BREAK", completed: true },
      { startTime: "17:30", endTime: "17:55", duration: 25 * 60, type: "FOCUS", completed: true },
      { startTime: "17:55", endTime: "18:10", duration: 15 * 60, type: "LONG_BREAK", completed: true },
    ],
    totalFocusMinutes: 100,
    totalBreakMinutes: 30,
    sessionsCompleted: 4,
    isActive: false,
  },
];

export default function ADHDStudyPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";

  const [activeSession, setActiveSession] = useState<StudySession | undefined>();
  const [studyHistory, setStudyHistory] = useState<StudySession[]>(mockStudyHistory);

  const handleStartSession = async (
    technique: StudyTechnique,
    settings?: PomodoroSettings
  ): Promise<StudySession> => {
    // TODO: API call
    const newSession: StudySession = {
      id: `session-${Date.now()}`,
      learnerId,
      date: new Date().toISOString().split("T")[0],
      technique,
      pomodoroSettings: settings,
      intervals: [],
      totalFocusMinutes: 0,
      totalBreakMinutes: 0,
      sessionsCompleted: 0,
      isActive: true,
    };

    setActiveSession(newSession);
    return newSession;
  };

  const handleEndSession = async (sessionId: string) => {
    // TODO: API call
    if (activeSession) {
      setStudyHistory((prev) => [{ ...activeSession, isActive: false }, ...prev]);
      setActiveSession(undefined);
    }
  };

  const handleRecordInterval = async (sessionId: string, interval: StudyInterval) => {
    // TODO: API call
    if (activeSession) {
      const newMinutes = Math.round(interval.duration / 60);
      setActiveSession((prev) =>
        prev
          ? {
              ...prev,
              intervals: [...prev.intervals, interval],
              totalFocusMinutes:
                interval.type === "FOCUS"
                  ? prev.totalFocusMinutes + newMinutes
                  : prev.totalFocusMinutes,
              totalBreakMinutes:
                interval.type !== "FOCUS"
                  ? prev.totalBreakMinutes + newMinutes
                  : prev.totalBreakMinutes,
              sessionsCompleted:
                interval.type === "FOCUS" && interval.completed
                  ? prev.sessionsCompleted + 1
                  : prev.sessionsCompleted,
            }
          : undefined
      );
    }
  };

  // Calculate weekly stats
  const thisWeek = studyHistory.filter((s) => {
    const sessionDate = new Date(s.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate > weekAgo;
  });

  const weeklyFocusMinutes = thisWeek.reduce((sum, s) => sum + s.totalFocusMinutes, 0);
  const weeklyPomodoros = thisWeek.reduce((sum, s) => sum + s.sessionsCompleted, 0);
  const weeklyStudySessions = thisWeek.length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Study Sessions</h1>
          <p className="text-muted-foreground">
            Pomodoro timer and focus tracking tools
          </p>
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Focus Time</CardDescription>
            <CardTitle className="text-3xl">{Math.round(weeklyFocusMinutes / 60)}h</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{weeklyFocusMinutes} minutes this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pomodoros</CardDescription>
            <CardTitle className="text-3xl">{weeklyPomodoros}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Completed this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sessions</CardDescription>
            <CardTitle className="text-3xl">{weeklyStudySessions}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Study sessions this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Streak</CardDescription>
            <CardTitle className="text-3xl">5 days</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Consecutive study days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pomodoro Timer */}
        <StudySessionTimer
          session={activeSession}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
          onRecordInterval={handleRecordInterval}
        />

        {/* Study History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Sessions</CardTitle>
                <CardDescription>Your study session history</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <BarChart2 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {studyHistory.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {new Date(session.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.sessionsCompleted} pomodoros • {session.totalFocusMinutes} min focus
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{session.technique}</Badge>
              </div>
            ))}
            {studyHistory.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No study sessions yet. Start your first Pomodoro!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Activity</CardTitle>
          <CardDescription>Focus time distribution across the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-32 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
              const height = [40, 75, 60, 90, 50, 30, 20][i];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-purple-500 rounded-t transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

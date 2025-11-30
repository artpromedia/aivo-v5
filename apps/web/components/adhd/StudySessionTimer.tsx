"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Coffee,
  Clock,
  CheckCircle2,
  Settings,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StudyTechnique = "POMODORO" | "TIME_BLOCKING" | "BODY_DOUBLING" | "MUSIC_FOCUS";

export interface PomodoroSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number;
}

export interface StudyInterval {
  startTime: string;
  endTime?: string;
  duration: number; // actual seconds
  type: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";
  completed: boolean;
}

export interface StudySession {
  id: string;
  learnerId: string;
  date: string;
  technique: StudyTechnique;
  pomodoroSettings?: PomodoroSettings;
  intervals: StudyInterval[];
  totalFocusMinutes: number;
  totalBreakMinutes: number;
  sessionsCompleted: number;
  notes?: string;
  isActive: boolean;
}

interface StudySessionTimerProps {
  session?: StudySession;
  onStartSession: (technique: StudyTechnique, settings?: PomodoroSettings) => Promise<StudySession>;
  onEndSession: (sessionId: string) => Promise<void>;
  onRecordInterval: (sessionId: string, interval: StudyInterval) => Promise<void>;
  className?: string;
}

const defaultSettings: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

export function StudySessionTimer({
  session: initialSession,
  onStartSession,
  onEndSession,
  onRecordInterval,
  className,
}: StudySessionTimerProps) {
  const [session, setSession] = useState<StudySession | undefined>(initialSession);
  const [settings, setSettings] = useState<PomodoroSettings>(
    initialSession?.pomodoroSettings || defaultSettings
  );
  const [showSettings, setShowSettings] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<"FOCUS" | "SHORT_BREAK" | "LONG_BREAK">("FOCUS");
  const [timeRemaining, setTimeRemaining] = useState(settings.focusDuration * 60);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentIntervalStart, setCurrentIntervalStart] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get the duration for the current phase
  const getPhaseDuration = useCallback(
    (phase: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK") => {
      switch (phase) {
        case "FOCUS":
          return settings.focusDuration * 60;
        case "SHORT_BREAK":
          return settings.shortBreakDuration * 60;
        case "LONG_BREAK":
          return settings.longBreakDuration * 60;
      }
    },
    [settings]
  );

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Play notification sound
  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  // Handle phase completion
  const handlePhaseComplete = useCallback(async () => {
    playSound();

    // Record the completed interval
    if (session && currentIntervalStart) {
      const interval: StudyInterval = {
        startTime: currentIntervalStart,
        endTime: new Date().toISOString(),
        duration: getPhaseDuration(currentPhase),
        type: currentPhase,
        completed: true,
      };
      await onRecordInterval(session.id, interval);
    }

    if (currentPhase === "FOCUS") {
      const newCompleted = completedPomodoros + 1;
      setCompletedPomodoros(newCompleted);

      // Check if it's time for a long break
      if (newCompleted % settings.sessionsBeforeLongBreak === 0) {
        setCurrentPhase("LONG_BREAK");
        setTimeRemaining(settings.longBreakDuration * 60);
      } else {
        setCurrentPhase("SHORT_BREAK");
        setTimeRemaining(settings.shortBreakDuration * 60);
      }
    } else {
      // Break completed, start focus
      setCurrentPhase("FOCUS");
      setTimeRemaining(settings.focusDuration * 60);
    }

    setCurrentIntervalStart(new Date().toISOString());
    setIsRunning(false);
  }, [
    currentPhase,
    completedPomodoros,
    settings,
    session,
    currentIntervalStart,
    getPhaseDuration,
    playSound,
    onRecordInterval,
  ]);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, handlePhaseComplete]);

  // Start session
  const handleStartSession = async () => {
    const newSession = await onStartSession("POMODORO", settings);
    setSession(newSession);
    setCurrentIntervalStart(new Date().toISOString());
    setIsRunning(true);
  };

  // End session
  const handleEndSession = async () => {
    if (session) {
      // Record partial interval if running
      if (isRunning && currentIntervalStart) {
        const elapsed = getPhaseDuration(currentPhase) - timeRemaining;
        const interval: StudyInterval = {
          startTime: currentIntervalStart,
          endTime: new Date().toISOString(),
          duration: elapsed,
          type: currentPhase,
          completed: false,
        };
        await onRecordInterval(session.id, interval);
      }
      await onEndSession(session.id);
      setSession(undefined);
      setIsRunning(false);
      setCompletedPomodoros(0);
      setCurrentPhase("FOCUS");
      setTimeRemaining(settings.focusDuration * 60);
    }
  };

  // Toggle timer
  const toggleTimer = () => {
    if (!session) {
      handleStartSession();
    } else {
      if (!isRunning) {
        setCurrentIntervalStart(new Date().toISOString());
      }
      setIsRunning(!isRunning);
    }
  };

  // Reset current phase
  const resetPhase = () => {
    setTimeRemaining(getPhaseDuration(currentPhase));
    setIsRunning(false);
  };

  // Skip to next phase
  const skipPhase = () => {
    if (currentPhase === "FOCUS") {
      const newCompleted = completedPomodoros + 1;
      setCompletedPomodoros(newCompleted);
      if (newCompleted % settings.sessionsBeforeLongBreak === 0) {
        setCurrentPhase("LONG_BREAK");
        setTimeRemaining(settings.longBreakDuration * 60);
      } else {
        setCurrentPhase("SHORT_BREAK");
        setTimeRemaining(settings.shortBreakDuration * 60);
      }
    } else {
      setCurrentPhase("FOCUS");
      setTimeRemaining(settings.focusDuration * 60);
    }
    setIsRunning(false);
  };

  // Calculate progress percentage
  const totalDuration = getPhaseDuration(currentPhase);
  const progressPercent = ((totalDuration - timeRemaining) / totalDuration) * 100;

  const phaseConfig = {
    FOCUS: { label: "Focus Time", color: "text-blue-600", bgColor: "bg-blue-500" },
    SHORT_BREAK: { label: "Short Break", color: "text-green-600", bgColor: "bg-green-500" },
    LONG_BREAK: { label: "Long Break", color: "text-purple-600", bgColor: "bg-purple-500" },
  };

  return (
    <Card className={cn("p-6", className)}>
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} src="/sounds/timer-complete.mp3" preload="auto" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold">Pomodoro Timer</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4 text-gray-400" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
          <h4 className="font-medium text-sm">Timer Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <SettingInput
              label="Focus Duration"
              value={settings.focusDuration}
              onChange={(v) => setSettings({ ...settings, focusDuration: v })}
              min={5}
              max={60}
              suffix="min"
            />
            <SettingInput
              label="Short Break"
              value={settings.shortBreakDuration}
              onChange={(v) => setSettings({ ...settings, shortBreakDuration: v })}
              min={1}
              max={15}
              suffix="min"
            />
            <SettingInput
              label="Long Break"
              value={settings.longBreakDuration}
              onChange={(v) => setSettings({ ...settings, longBreakDuration: v })}
              min={5}
              max={30}
              suffix="min"
            />
            <SettingInput
              label="Sessions for Long Break"
              value={settings.sessionsBeforeLongBreak}
              onChange={(v) => setSettings({ ...settings, sessionsBeforeLongBreak: v })}
              min={2}
              max={8}
              suffix=""
            />
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center mb-6">
        {/* Phase Badge */}
        <Badge
          className={cn(
            "mb-4",
            currentPhase === "FOCUS"
              ? "bg-blue-100 text-blue-700"
              : currentPhase === "SHORT_BREAK"
              ? "bg-green-100 text-green-700"
              : "bg-purple-100 text-purple-700"
          )}
        >
          {currentPhase === "FOCUS" ? (
            <Clock className="h-3 w-3 mr-1" />
          ) : (
            <Coffee className="h-3 w-3 mr-1" />
          )}
          {phaseConfig[currentPhase].label}
        </Badge>

        {/* Circular Progress */}
        <div className="relative w-48 h-48 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - progressPercent / 100)}
              className={cn(
                "transition-all duration-1000",
                phaseConfig[currentPhase].color
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums">
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        {/* Pomodoro Count */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                i < completedPomodoros
                  ? "bg-green-500"
                  : i === completedPomodoros && currentPhase === "FOCUS"
                  ? "bg-blue-500 animate-pulse"
                  : "bg-gray-200"
              )}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500">
          {completedPomodoros} pomodoro{completedPomodoros !== 1 ? "s" : ""} completed
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="sm" onClick={resetPhase}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="lg"
          onClick={toggleTimer}
          className={cn(
            "w-16 h-16 rounded-full",
            isRunning && "bg-orange-500 hover:bg-orange-600"
          )}
        >
          {isRunning ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={skipPhase}>
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </div>

      {/* End Session Button */}
      {session && (
        <div className="mt-6 text-center">
          <Button variant="ghost" size="sm" onClick={handleEndSession}>
            End Session
          </Button>
        </div>
      )}
    </Card>
  );
}

// Setting Input Component
interface SettingInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  suffix: string;
}

function SettingInput({ label, value, onChange, min, max, suffix }: SettingInputProps) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-12 text-center font-medium">
          {value}
          {suffix && <span className="text-xs text-gray-500 ml-1">{suffix}</span>}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

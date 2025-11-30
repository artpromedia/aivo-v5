"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Timer, 
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransitionTimerProps {
  duration: number; // in seconds
  warningAt?: number[]; // seconds remaining to give warnings
  activityName: string;
  nextActivity?: string;
  onComplete?: () => void;
  onWarning?: (secondsRemaining: number) => void;
  autoStart?: boolean;
  showVisualProgress?: boolean;
  enableSound?: boolean;
  className?: string;
}

export function TransitionTimer({
  duration,
  warningAt = [60, 30, 10, 5],
  activityName,
  nextActivity,
  onComplete,
  onWarning,
  autoStart = false,
  showVisualProgress = true,
  enableSound: initialEnableSound = true,
  className,
}: TransitionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);
  const [currentWarning, setCurrentWarning] = useState<number | null>(null);
  const [enableSound, setEnableSound] = useState(initialEnableSound);
  const warningsGiven = useRef<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get progress percentage
  const progress = ((duration - timeRemaining) / duration) * 100;

  // Get color based on time remaining
  const getColor = () => {
    const percentRemaining = (timeRemaining / duration) * 100;
    if (percentRemaining <= 10) return "text-red-500";
    if (percentRemaining <= 25) return "text-orange-500";
    if (percentRemaining <= 50) return "text-yellow-500";
    return "text-green-500";
  };

  const speak = useCallback((text: string) => {
    if (!enableSound || typeof window === "undefined") return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [enableSound]);

  // Handle timer tick
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          
          // Check for warnings
          if (warningAt.includes(newTime) && !warningsGiven.current.has(newTime)) {
            warningsGiven.current.add(newTime);
            setCurrentWarning(newTime);
            onWarning?.(newTime);
            
            // Speak warning
            const minutes = Math.floor(newTime / 60);
            const seconds = newTime % 60;
            let timeText = "";
            if (minutes > 0) timeText = `${minutes} minute${minutes > 1 ? "s" : ""}`;
            if (seconds > 0) timeText += `${minutes > 0 ? " and " : ""}${seconds} second${seconds > 1 ? "s" : ""}`;
            speak(`${timeText} until ${nextActivity || "transition"}`);
            
            setTimeout(() => setCurrentWarning(null), 3000);
          }
          
          return newTime;
        });
      }, 1000);
    } else if (timeRemaining === 0 && !isComplete) {
      setIsComplete(true);
      setIsRunning(false);
      speak(`Time for ${nextActivity || "the next activity"}!`);
      onComplete?.();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, warningAt, onWarning, onComplete, speak, nextActivity, isComplete]);

  const handleStart = () => {
    if (isComplete) {
      handleReset();
    }
    setIsRunning(true);
    speak(`Starting timer for ${activityName}. ${formatTime(duration)} remaining.`);
  };

  const handlePause = () => {
    setIsRunning(false);
    speak("Timer paused");
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(duration);
    setIsComplete(false);
    setCurrentWarning(null);
    warningsGiven.current.clear();
  };

  // Calculate visual segments for progress
  const segments = 12;
  const segmentAngle = 360 / segments;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            {activityName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEnableSound(!enableSound)}
          >
            {enableSound ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning Banner */}
        {currentWarning !== null && (
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center gap-2 animate-pulse">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <span className="font-semibold text-orange-700 dark:text-orange-300">
              {currentWarning >= 60 
                ? `${Math.floor(currentWarning / 60)} minute${Math.floor(currentWarning / 60) > 1 ? "s" : ""} left!`
                : `${currentWarning} seconds left!`
              }
            </span>
          </div>
        )}

        {/* Timer Display */}
        <div className="flex justify-center">
          {showVisualProgress ? (
            <div className="relative w-48 h-48">
              {/* Background circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className={cn("transition-all duration-1000", getColor())}
                />
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isComplete ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                    <span className="text-lg font-semibold">Done!</span>
                  </>
                ) : (
                  <>
                    <span className={cn("text-4xl font-bold", getColor())}>
                      {formatTime(timeRemaining)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      remaining
                    </span>
                  </>
                )}
              </div>

              {/* Segment markers */}
              {Array.from({ length: segments }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-3 bg-gray-300 dark:bg-gray-600"
                  style={{
                    left: "50%",
                    top: "4px",
                    transform: `translateX(-50%) rotate(${i * segmentAngle}deg)`,
                    transformOrigin: "50% 92px",
                  }}
                />
              ))}
            </div>
          ) : (
            <div className={cn(
              "text-6xl font-bold py-8",
              getColor(),
              isComplete && "text-green-500"
            )}>
              {isComplete ? "Done!" : formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {/* Progress bar (alternative visual) */}
        {showVisualProgress && (
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                progress >= 90 ? "bg-red-500" :
                progress >= 75 ? "bg-orange-500" :
                progress >= 50 ? "bg-yellow-500" : "bg-green-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Next Activity Preview */}
        {nextActivity && !isComplete && (
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Next:</div>
            <div className="text-lg font-semibold">{nextActivity}</div>
          </div>
        )}

        {/* Completion Message */}
        {isComplete && nextActivity && (
          <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg animate-bounce">
            <div className="text-xl font-bold text-green-700 dark:text-green-300">
              Time for {nextActivity}!
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3">
          {!isRunning ? (
            <Button size="lg" onClick={handleStart} className="gap-2">
              <Play className="h-5 w-5" />
              {isComplete ? "Restart" : "Start"}
            </Button>
          ) : (
            <Button size="lg" variant="outline" onClick={handlePause} className="gap-2">
              <Pause className="h-5 w-5" />
              Pause
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-5 w-5" />
            Reset
          </Button>
        </div>

        {/* Status */}
        <div className="flex justify-center">
          <Badge variant={isRunning ? "default" : "secondary"}>
            {isComplete ? "Complete" : isRunning ? "Running" : "Paused"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

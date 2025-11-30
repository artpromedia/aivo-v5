"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  ArrowRight, 
  CheckCircle,
  Image,
  Volume2,
  RotateCcw,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FirstThenItem {
  label: string;
  imageUrl?: string;
  completed?: boolean;
}

interface FirstThenBoardProps {
  firstItem: FirstThenItem;
  thenItem: FirstThenItem;
  title?: string;
  onFirstComplete?: () => void;
  onThenComplete?: () => void;
  onReset?: () => void;
  readOnly?: boolean;
  className?: string;
}

export function FirstThenBoard({
  firstItem,
  thenItem,
  title = "First / Then",
  onFirstComplete,
  onThenComplete,
  onReset,
  readOnly = false,
  className,
}: FirstThenBoardProps) {
  const [first, setFirst] = useState<FirstThenItem>(firstItem);
  const [then, setThen] = useState<FirstThenItem>(thenItem);

  const handleFirstComplete = () => {
    if (readOnly) return;
    setFirst((prev) => ({ ...prev, completed: true }));
    onFirstComplete?.();
    
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(`Great job! You finished ${first.label}. Now you can ${then.label}!`);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleThenComplete = () => {
    if (readOnly || !first.completed) return;
    setThen((prev) => ({ ...prev, completed: true }));
    onThenComplete?.();
    
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance("All done! Great work!");
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleReset = () => {
    setFirst((prev) => ({ ...prev, completed: false }));
    setThen((prev) => ({ ...prev, completed: false }));
    onReset?.();
  };

  const handleReadAloud = () => {
    if ("speechSynthesis" in window) {
      const text = `First, ${first.label}. Then, ${then.label}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleReadAloud}>
              <Volume2 className="h-4 w-4" />
            </Button>
            {!readOnly && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* First */}
          <div
            className={cn(
              "flex-1 p-4 rounded-xl border-4 transition-all",
              first.completed
                ? "border-green-400 bg-green-50 dark:bg-green-900/30"
                : "border-blue-400 bg-blue-50 dark:bg-blue-900/30",
              !readOnly && !first.completed && "cursor-pointer hover:shadow-lg"
            )}
            onClick={!first.completed ? handleFirstComplete : undefined}
            role={!first.completed && !readOnly ? "button" : undefined}
          >
            {/* Label */}
            <div className="text-center mb-2">
              <Badge 
                variant={first.completed ? "default" : "outline"} 
                className={cn(
                  "text-lg px-4 py-1",
                  first.completed && "bg-green-600"
                )}
              >
                FIRST
              </Badge>
            </div>

            {/* Image/Placeholder */}
            <div className={cn(
              "w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden mb-3",
              first.completed ? "bg-green-100 dark:bg-green-800" : "bg-white dark:bg-gray-800"
            )}>
              {first.completed ? (
                <CheckCircle className="h-20 w-20 text-green-500" />
              ) : first.imageUrl ? (
                <img src={first.imageUrl} alt={first.label} className="w-full h-full object-cover" />
              ) : (
                <Image className="h-16 w-16 text-muted-foreground" />
              )}
            </div>

            {/* Text */}
            <div className={cn(
              "text-xl font-semibold text-center",
              first.completed && "line-through opacity-60"
            )}>
              {first.label}
            </div>

            {!readOnly && !first.completed && (
              <Button className="w-full mt-3" size="lg">
                <CheckCircle className="h-5 w-5 mr-2" />
                Done
              </Button>
            )}
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <ArrowRight className={cn(
              "h-10 w-10 transition-colors",
              first.completed ? "text-green-500" : "text-gray-400"
            )} />
          </div>

          {/* Then */}
          <div
            className={cn(
              "flex-1 p-4 rounded-xl border-4 transition-all",
              then.completed
                ? "border-green-400 bg-green-50 dark:bg-green-900/30"
                : first.completed
                  ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 animate-pulse"
                  : "border-gray-300 bg-gray-50 dark:bg-gray-800 opacity-50",
              !readOnly && first.completed && !then.completed && "cursor-pointer hover:shadow-lg"
            )}
            onClick={first.completed && !then.completed ? handleThenComplete : undefined}
            role={first.completed && !then.completed && !readOnly ? "button" : undefined}
          >
            {/* Label */}
            <div className="text-center mb-2">
              <Badge 
                variant={then.completed ? "default" : "outline"} 
                className={cn(
                  "text-lg px-4 py-1",
                  then.completed && "bg-green-600"
                )}
              >
                THEN
              </Badge>
            </div>

            {/* Image/Placeholder */}
            <div className={cn(
              "w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden mb-3",
              then.completed 
                ? "bg-green-100 dark:bg-green-800" 
                : first.completed
                  ? "bg-yellow-100 dark:bg-yellow-800"
                  : "bg-gray-100 dark:bg-gray-700"
            )}>
              {then.completed ? (
                <CheckCircle className="h-20 w-20 text-green-500" />
              ) : then.imageUrl ? (
                <img src={then.imageUrl} alt={then.label} className="w-full h-full object-cover" />
              ) : (
                <Image className="h-16 w-16 text-muted-foreground" />
              )}
            </div>

            {/* Text */}
            <div className={cn(
              "text-xl font-semibold text-center",
              then.completed && "line-through opacity-60"
            )}>
              {then.label}
            </div>

            {!readOnly && first.completed && !then.completed && (
              <Button className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-black" size="lg">
                <CheckCircle className="h-5 w-5 mr-2" />
                Done
              </Button>
            )}
          </div>
        </div>

        {/* All Done Banner */}
        {first.completed && then.completed && (
          <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl text-center animate-bounce">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              🎉 All Done! Great Job! 🎉
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mini version for embedding in schedules
interface FirstThenMiniProps {
  firstLabel: string;
  thenLabel: string;
  firstImage?: string;
  thenImage?: string;
  className?: string;
}

export function FirstThenMini({
  firstLabel,
  thenLabel,
  firstImage,
  thenImage,
  className,
}: FirstThenMiniProps) {
  return (
    <div className={cn("flex items-center gap-2 p-2 bg-muted rounded-lg", className)}>
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs">1st</Badge>
        {firstImage && (
          <div className="w-8 h-8 rounded overflow-hidden">
            <img src={firstImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <span className="text-sm font-medium">{firstLabel}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs">Then</Badge>
        {thenImage && (
          <div className="w-8 h-8 rounded overflow-hidden">
            <img src={thenImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <span className="text-sm font-medium">{thenLabel}</span>
      </div>
    </div>
  );
}

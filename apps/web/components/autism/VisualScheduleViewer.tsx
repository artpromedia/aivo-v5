"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { 
  Calendar, 
  Check,
  Clock,
  Image,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VisualSchedule, ScheduleItem } from "./VisualScheduleEditor";

interface VisualScheduleViewerProps {
  schedule: VisualSchedule;
  onItemComplete?: (itemId: string, isCompleted: boolean) => void;
  onReset?: () => void;
  interactive?: boolean;
  className?: string;
}

const imageSizeClasses = {
  small: "w-12 h-12",
  medium: "w-20 h-20",
  large: "w-28 h-28",
};

export function VisualScheduleViewer({
  schedule,
  onItemComplete,
  onReset,
  interactive = true,
  className,
}: VisualScheduleViewerProps) {
  const [items, setItems] = useState<ScheduleItem[]>(schedule.items);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setItems(schedule.items);
  }, [schedule.items]);

  const handleToggle = (itemId: string) => {
    if (!interactive) return;
    
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setItems(updated);
    
    const item = updated.find((i) => i.id === itemId);
    if (item && onItemComplete) {
      onItemComplete(itemId, item.isCompleted);
    }
  };

  const handleReset = () => {
    setItems(items.map((item) => ({ ...item, isCompleted: false })));
    setCurrentIndex(0);
    onReset?.();
  };

  const completedCount = items.filter((i) => i.isCompleted).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  // Vertical layout
  if (schedule.displayFormat === "vertical") {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {schedule.name}
          </CardTitle>
          {interactive && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>{completedCount} of {items.length} completed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-4 p-4 border rounded-lg transition-all",
                  item.isCompleted && "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                )}
                onClick={() => handleToggle(item.id)}
                role={interactive ? "button" : undefined}
              >
                {schedule.showCheckboxes && (
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                    item.isCompleted 
                      ? "bg-green-500 border-green-500" 
                      : "border-muted-foreground"
                  )}>
                    {item.isCompleted && <Check className="h-5 w-5 text-white" />}
                  </div>
                )}

                <div className={cn(
                  "rounded-lg bg-muted flex items-center justify-center overflow-hidden",
                  imageSizeClasses[schedule.imageSize]
                )}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.activity} className="w-full h-full object-cover" />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <div className={cn(
                    "font-medium text-lg",
                    item.isCompleted && "line-through text-muted-foreground"
                  )}>
                    {item.activity}
                  </div>
                  {schedule.showTimes && item.startTime && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {item.startTime}
                      {item.endTime && ` - ${item.endTime}`}
                    </div>
                  )}
                </div>

                {item.isCompleted && (
                  <Badge className="bg-green-500">Done!</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Horizontal layout (single item focus)
  if (schedule.displayFormat === "horizontal") {
    const currentItem = items[currentIndex];
    
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {schedule.name}
          </CardTitle>
          <Badge variant="outline">
            {currentIndex + 1} / {items.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {items.map((item, i) => (
              <button
                key={item.id}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  i === currentIndex 
                    ? "bg-primary scale-125" 
                    : item.isCompleted 
                      ? "bg-green-500" 
                      : "bg-muted"
                )}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>

          {/* Current item */}
          {currentItem && (
            <div className="text-center">
              <div className="w-48 h-48 mx-auto rounded-xl bg-muted flex items-center justify-center overflow-hidden mb-4">
                {currentItem.imageUrl ? (
                  <img src={currentItem.imageUrl} alt={currentItem.activity} className="w-full h-full object-cover" />
                ) : (
                  <Image className="h-16 w-16 text-muted-foreground" />
                )}
              </div>

              <h3 className={cn(
                "text-2xl font-bold mb-2",
                currentItem.isCompleted && "line-through text-muted-foreground"
              )}>
                {currentItem.activity}
              </h3>

              {schedule.showTimes && currentItem.startTime && (
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-4">
                  <Clock className="h-4 w-4" />
                  {currentItem.startTime}
                </div>
              )}

              {interactive && (
                <Button
                  size="lg"
                  className={cn(
                    "w-full max-w-xs",
                    currentItem.isCompleted && "bg-green-500 hover:bg-green-600"
                  )}
                  onClick={() => handleToggle(currentItem.id)}
                >
                  {currentItem.isCompleted ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Completed!
                    </>
                  ) : (
                    "Mark Done"
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(Math.min(items.length - 1, currentIndex + 1))}
              disabled={currentIndex === items.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid layout
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {schedule.name}
        </CardTitle>
        {interactive && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "p-4 border rounded-lg text-center cursor-pointer transition-all",
                item.isCompleted && "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
              )}
              onClick={() => handleToggle(item.id)}
            >
              <div className={cn(
                "mx-auto rounded-lg bg-muted flex items-center justify-center overflow-hidden mb-2",
                imageSizeClasses[schedule.imageSize]
              )}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.activity} className="w-full h-full object-cover" />
                ) : (
                  <Image className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              
              <div className={cn(
                "font-medium",
                item.isCompleted && "line-through text-muted-foreground"
              )}>
                {item.activity}
              </div>

              {schedule.showTimes && item.startTime && (
                <div className="text-xs text-muted-foreground mt-1">
                  {item.startTime}
                </div>
              )}

              {item.isCompleted && (
                <Badge className="bg-green-500 mt-2">✓</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

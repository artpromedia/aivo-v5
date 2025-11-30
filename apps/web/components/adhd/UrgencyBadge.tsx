"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { AlertCircle, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

export type UrgencyLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  daysUntilDue?: number;
  showIcon?: boolean;
  showDays?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const urgencyConfig: Record<
  UrgencyLevel,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    icon: typeof AlertCircle;
    pulseColor?: string;
  }
> = {
  CRITICAL: {
    label: "Critical",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-300",
    borderColor: "border-red-300 dark:border-red-700",
    icon: AlertCircle,
    pulseColor: "animate-pulse",
  },
  HIGH: {
    label: "High",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-300",
    borderColor: "border-orange-300 dark:border-orange-700",
    icon: AlertTriangle,
  },
  MEDIUM: {
    label: "Medium",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    textColor: "text-yellow-700 dark:text-yellow-300",
    borderColor: "border-yellow-300 dark:border-yellow-700",
    icon: Clock,
  },
  LOW: {
    label: "Low",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-300",
    borderColor: "border-green-300 dark:border-green-700",
    icon: CheckCircle2,
  },
};

const sizeConfig = {
  sm: {
    badge: "text-xs px-2 py-0.5",
    icon: "h-3 w-3",
  },
  md: {
    badge: "text-sm px-2.5 py-1",
    icon: "h-4 w-4",
  },
  lg: {
    badge: "text-base px-3 py-1.5",
    icon: "h-5 w-5",
  },
};

export function UrgencyBadge({
  urgency,
  daysUntilDue,
  showIcon = true,
  showDays = false,
  size = "md",
  className,
}: UrgencyBadgeProps) {
  const config = urgencyConfig[urgency];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  const getDaysText = () => {
    if (daysUntilDue === undefined) return "";
    if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)}d overdue`;
    if (daysUntilDue === 0) return "Due today";
    if (daysUntilDue === 1) return "Due tomorrow";
    return `${daysUntilDue}d left`;
  };

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border",
        config.bgColor,
        config.textColor,
        config.borderColor,
        config.pulseColor,
        sizeStyles.badge,
        className
      )}
    >
      {showIcon && <Icon className={sizeStyles.icon} />}
      <span>{config.label}</span>
      {showDays && daysUntilDue !== undefined && (
        <span className="opacity-75">• {getDaysText()}</span>
      )}
    </Badge>
  );
}

/**
 * Calculate urgency level based on days until due
 */
export function calculateUrgency(daysUntilDue: number): UrgencyLevel {
  if (daysUntilDue <= 1) return "CRITICAL";
  if (daysUntilDue <= 3) return "HIGH";
  if (daysUntilDue <= 7) return "MEDIUM";
  return "LOW";
}

/**
 * Calculate days until due from a date string
 */
export function getDaysUntilDue(dueDate: string | Date): number {
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

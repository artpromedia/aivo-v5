"use client";

import { cn } from "@aivo/ui/lib/utils";

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export function AdminCard({ children, className, padding = "md" }: AdminCardProps) {
  const paddingClasses = {
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-lg border border-lavender-100",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface AdminCardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function AdminCardHeader({ children, className, action }: AdminCardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface AdminCardTitleProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function AdminCardTitle({ children, icon, className }: AdminCardTitleProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900">{children}</h3>
    </div>
  );
}

interface AdminCardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminCardDescription({ children, className }: AdminCardDescriptionProps) {
  return <p className={cn("text-sm text-slate-500 mt-1", className)}>{children}</p>;
}

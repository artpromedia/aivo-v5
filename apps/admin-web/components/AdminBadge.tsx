"use client";

import { cn } from "@aivo/ui/lib/utils";

export interface AdminBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "violet";
  size?: "sm" | "md";
  className?: string;
}

export function AdminBadge({
  children,
  variant = "default",
  size = "sm",
  className,
}: AdminBadgeProps) {
  const variantClasses = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// Status-specific badges
export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { variant: AdminBadgeProps["variant"]; label: string }
  > = {
    HEALTHY: { variant: "success", label: "Healthy" },
    DEGRADED: { variant: "warning", label: "Degraded" },
    UNHEALTHY: { variant: "danger", label: "Unhealthy" },
    UNKNOWN: { variant: "default", label: "Unknown" },
    ACTIVE: { variant: "success", label: "Active" },
    INACTIVE: { variant: "default", label: "Inactive" },
  };

  const config = statusConfig[status] || statusConfig.UNKNOWN;

  return <AdminBadge variant={config.variant}>{config.label}</AdminBadge>;
}

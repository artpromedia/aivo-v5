import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  const variants = {
    default: "bg-blue-100 text-blue-800",
    outline: "border border-slate-200 text-slate-700"
  };
  return <span className={cn(base, variants[variant], className)} {...props} />;
}

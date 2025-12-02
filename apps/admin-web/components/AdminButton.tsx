"use client";

import { cn } from "@aivo/ui/lib/utils";
import { forwardRef } from "react";

export interface AdminButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary:
        "bg-violet-600 text-white hover:bg-violet-700 shadow-sm disabled:bg-violet-300",
      secondary:
        "bg-lavender-100 text-slate-700 hover:bg-lavender-200 disabled:bg-slate-100",
      danger:
        "bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-red-50 disabled:text-red-300",
      success:
        "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:bg-emerald-50",
      ghost:
        "bg-transparent text-slate-600 hover:bg-lavender-50 hover:text-slate-900",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);

AdminButton.displayName = "AdminButton";

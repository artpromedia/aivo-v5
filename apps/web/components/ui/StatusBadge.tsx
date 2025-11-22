'use client'

interface StatusBadgeProps {
  status: "ALERT" | "HEALTHY" | "INFO";
  label?: string;
}

const statusStyles: Record<StatusBadgeProps["status"], string> = {
  ALERT: "bg-rose-50 text-rose-600",
  HEALTHY: "bg-emerald-50 text-emerald-600",
  INFO: "bg-blue-50 text-blue-600"
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {label ?? status}
    </span>
  );
}

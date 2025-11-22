'use client'

import type { Accommodation } from "@/lib/accommodations/accommodation-manager";
import { cn } from "@/lib/utils";

interface AccommodationToggleProps {
  accommodation: Accommodation;
  label?: string;
  description?: string;
  enabled: boolean;
  effectiveness?: number;
  onToggle: (enabled: boolean) => void;
}

export function AccommodationToggle({
  accommodation,
  label,
  description,
  enabled,
  effectiveness,
  onToggle
}: AccommodationToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      className={cn(
        "w-full rounded-2xl border px-4 py-3 text-left transition",
        enabled ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label ?? formatAccommodation(accommodation)}</p>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
        <span
          className={cn(
            "inline-flex min-w-[2.5rem] justify-center rounded-full px-2 text-xs font-semibold",
            enabled ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
          )}
        >
          {enabled ? "On" : "Off"}
        </span>
      </div>
      {typeof effectiveness === "number" && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <div className="h-1 flex-1 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(effectiveness * 100, 100)}%` }} />
          </div>
          <span>{Math.round(effectiveness * 100)}%</span>
        </div>
      )}
    </button>
  );
}

function formatAccommodation(value: Accommodation) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(" ");
}

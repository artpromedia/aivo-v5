'use client'

import { useState } from "react";

interface DateRangePickerProps {
  onChange?: (range: { start: string | null; end: string | null }) => void;
}

export function DateRangePicker({ onChange }: DateRangePickerProps) {
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);

  const handleChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      setStart(value || null);
      onChange?.({ start: value || null, end });
    } else {
      setEnd(value || null);
      onChange?.({ start, end: value || null });
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
      <label className="flex flex-col text-xs font-semibold text-slate-500">
        Start
        <input
          type="date"
          className="mt-1 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700"
          value={start ?? ""}
          onChange={(event) => handleChange("start", event.target.value)}
        />
      </label>
      <span className="mt-4 text-slate-400">→</span>
      <label className="flex flex-col text-xs font-semibold text-slate-500">
        End
        <input
          type="date"
          className="mt-1 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700"
          value={end ?? ""}
          onChange={(event) => handleChange("end", event.target.value)}
        />
      </label>
    </div>
  );
}

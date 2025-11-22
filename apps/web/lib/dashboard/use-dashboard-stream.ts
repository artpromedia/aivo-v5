"use client";

import { useEffect } from "react";
import type { DashboardStreamEvent } from "@/lib/types/dashboard";

type DashboardScope = "parent" | "teacher";

type EventHandler = (event: DashboardStreamEvent) => void;

export function useDashboardStream(scope: DashboardScope, handler: EventHandler | null) {
  useEffect(() => {
    if (!handler) return undefined;

    const source = new EventSource(`/api/dashboards/stream?scope=${scope}`);

    const wrap = (type: DashboardStreamEvent["type"]) => (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data ?? "{}");
        handler({ type, ...data } as DashboardStreamEvent);
      } catch (error) {
        console.warn("Failed to parse dashboard stream event", error);
      }
    };

    source.addEventListener("parent-update", wrap("parent-update"));
    source.addEventListener("teacher-update", wrap("teacher-update"));
    source.addEventListener("approvals-update", wrap("approvals-update"));

    return () => {
      source.close();
    };
  }, [scope, handler]);
}

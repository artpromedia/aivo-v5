"use client";

import { cn } from "@aivo/ui/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface AdminTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function AdminTabs({ tabs, activeTab, onChange, className }: AdminTabsProps) {
  return (
    <div className={cn("border-b border-lavender-200", className)}>
      <nav className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === tab.id
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {tab.icon && <span className="text-lg">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-semibold rounded-full",
                  activeTab === tab.id
                    ? "bg-violet-100 text-violet-700"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

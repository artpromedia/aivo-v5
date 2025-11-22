'use client'

import { createContext, type ReactNode, useContext, useId, useState } from "react";

interface TabsContextValue {
  value: string;
  setValue: (next: string) => void;
  labelledBy: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ defaultValue, children, className }: { defaultValue: string; children: ReactNode; className?: string }) {
  const [value, setValue] = useState(defaultValue);
  const labelledBy = useId();
  return (
    <TabsContext.Provider value={{ value, setValue, labelledBy }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  const context = useTabsContext();
  return (
    <div role="tablist" aria-labelledby={context.labelledBy} className={className}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const context = useTabsContext();
  const isActive = context.value === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        isActive ? "bg-slate-900 text-white" : "bg-white text-slate-600 shadow"
      }`}
      onClick={() => context.setValue(value)}
      type="button"
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const context = useTabsContext();
  if (context.value !== value) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used inside <Tabs>");
  }
  return context;
}

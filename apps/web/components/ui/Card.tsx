'use client'

import type { PropsWithChildren, ReactNode } from "react";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

type CardHeaderProps = PropsWithChildren<{
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}>;

type CardContentProps = PropsWithChildren<{
  className?: string;
}>;

const base = "rounded-2xl border border-slate-200/80 bg-white shadow-soft-coral";

export function Card({ className, children }: CardProps) {
  return <section className={`${base} ${className ?? ""}`.trim()}>{children}</section>;
}

export function CardHeader({ title, subtitle, action, children, className }: CardHeaderProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 ${className ?? ""}`.trim()}>
      <div>
        {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        {children}
      </div>
      {action}
    </div>
  );
}

export function CardContent({ className, children }: CardContentProps) {
  return <div className={`px-5 py-4 ${className ?? ""}`.trim()}>{children}</div>;
}

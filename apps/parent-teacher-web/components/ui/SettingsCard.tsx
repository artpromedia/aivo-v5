'use client';

import { ReactNode } from 'react';
import { cn } from '@aivo/ui/src/utils';

export interface SettingsCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** Card content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Settings card with consistent theming.
 * Uses rounded-3xl, shadow-lg for enterprise look.
 */
export function SettingsCard({ 
  title, 
  description, 
  children, 
  className 
}: SettingsCardProps) {
  return (
    <section 
      className={cn(
        'bg-white rounded-3xl shadow-lg p-6',
        className
      )}
      aria-labelledby={`settings-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <h2 
        id={`settings-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className="text-lg font-semibold text-slate-900"
      >
        {title}
      </h2>
      {description && (
        <p className="text-sm text-slate-500 mb-6">{description}</p>
      )}
      {!description && <div className="mb-6" />}
      {children}
    </section>
  );
}

export interface SettingsGridProps {
  /** Grid items */
  children: ReactNode;
  /** Number of columns on desktop */
  columns?: 1 | 2;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Grid layout for settings toggles.
 */
export function SettingsGrid({ 
  children, 
  columns = 2,
  className 
}: SettingsGridProps) {
  return (
    <div 
      className={cn(
        'grid gap-4',
        columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1',
        className
      )}
    >
      {children}
    </div>
  );
}

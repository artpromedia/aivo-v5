'use client';

import { motion } from 'framer-motion';
import {
  ClipboardList,
  Heart,
  Gamepad2,
  Settings,
  BookOpen,
  Target,
  Music,
  MessageCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface QuickAction {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Icon to display */
  icon: LucideIcon;
  /** Route to navigate to */
  href: string;
  /** Background gradient classes */
  gradient: string;
  /** Icon color class */
  iconColor: string;
  /** Whether this action should be highlighted */
  highlighted?: boolean;
  /** Badge text (e.g., "3 new") */
  badge?: string;
}

interface QuickActionsProps {
  /** Custom actions (overrides defaults) */
  actions?: QuickAction[];
  /** Number of columns (default: 2) */
  columns?: 2 | 3 | 4;
  /** Optional callback when action is clicked */
  onActionClick?: (actionId: string) => void;
}

// ============================================================================
// Default Actions Configuration
// ============================================================================

const defaultActions: QuickAction[] = [
  {
    id: 'homework',
    label: 'Homework',
    subtitle: '2 tasks due',
    icon: ClipboardList,
    href: '/homework',
    gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
    iconColor: 'text-white',
    highlighted: true,
    badge: '2',
  },
  {
    id: 'calm-corner',
    label: 'Calm Corner',
    subtitle: 'Relax & reset',
    icon: Heart,
    href: '/calm-corner',
    gradient: 'bg-gradient-to-br from-pink-400 to-rose-500',
    iconColor: 'text-white',
  },
  {
    id: 'brain-break',
    label: 'Brain Break',
    subtitle: 'Fun games',
    icon: Gamepad2,
    href: '/focus-break',
    gradient: 'bg-gradient-to-br from-emerald-400 to-teal-500',
    iconColor: 'text-white',
  },
  {
    id: 'settings',
    label: 'Settings',
    subtitle: 'Customize',
    icon: Settings,
    href: '/settings',
    gradient: 'bg-gradient-to-br from-gray-500 to-gray-600',
    iconColor: 'text-white',
  },
];

// ============================================================================
// Action Card Component
// ============================================================================

interface ActionCardProps {
  action: QuickAction;
  index: number;
  onClick?: () => void;
}

function ActionCard({ action, index, onClick }: ActionCardProps) {
  const Icon = action.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link
        href={action.href}
        onClick={onClick}
        className={`relative block ${action.gradient} rounded-2xl p-4 shadow-lg overflow-hidden min-h-[100px]`}
      >
        {/* Background decoration */}
        <div className="absolute -right-4 -bottom-4 opacity-20">
          <Icon className="w-20 h-20 text-white" />
        </div>

        {/* Badge */}
        {action.badge && (
          <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-violet-600">{action.badge}</span>
          </div>
        )}

        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
          <Icon className={`w-5 h-5 ${action.iconColor}`} />
        </div>

        {/* Label */}
        <h3 className="font-semibold text-white text-sm">{action.label}</h3>

        {/* Subtitle */}
        {action.subtitle && <p className="text-white/75 text-xs mt-0.5">{action.subtitle}</p>}

        {/* Highlight indicator */}
        {action.highlighted && (
          <motion.div
            className="absolute top-0 left-0 w-full h-1 bg-white/50"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </Link>
    </motion.div>
  );
}

// ============================================================================
// Main Quick Actions Component
// ============================================================================

export function QuickActions({
  actions = defaultActions,
  columns = 2,
  onActionClick,
}: QuickActionsProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 px-1">Quick Actions</h3>
      <div className={`grid ${gridCols[columns]} gap-3`}>
        {actions.map((action, index) => (
          <ActionCard
            key={action.id}
            action={action}
            index={index}
            onClick={() => onActionClick?.(action.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Preset Action Configurations
// ============================================================================

export const presetActions = {
  homework: {
    id: 'homework',
    label: 'Homework',
    icon: ClipboardList,
    href: '/homework',
    gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
    iconColor: 'text-white',
  },
  calmCorner: {
    id: 'calm-corner',
    label: 'Calm Corner',
    icon: Heart,
    href: '/calm-corner',
    gradient: 'bg-gradient-to-br from-pink-400 to-rose-500',
    iconColor: 'text-white',
  },
  brainBreak: {
    id: 'brain-break',
    label: 'Brain Break',
    icon: Gamepad2,
    href: '/focus-break',
    gradient: 'bg-gradient-to-br from-emerald-400 to-teal-500',
    iconColor: 'text-white',
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    gradient: 'bg-gradient-to-br from-gray-500 to-gray-600',
    iconColor: 'text-white',
  },
  lessons: {
    id: 'lessons',
    label: 'Lessons',
    icon: BookOpen,
    href: '/lessons',
    gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    iconColor: 'text-white',
  },
  goals: {
    id: 'goals',
    label: 'My Goals',
    icon: Target,
    href: '/goals',
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
    iconColor: 'text-white',
  },
  music: {
    id: 'music',
    label: 'Focus Music',
    icon: Music,
    href: '/music',
    gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    iconColor: 'text-white',
  },
  chat: {
    id: 'chat',
    label: 'Ask Aivo',
    icon: MessageCircle,
    href: '/chat',
    gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
    iconColor: 'text-white',
  },
} as const;

// ============================================================================
// Exports
// ============================================================================

export type { QuickActionsProps, QuickAction };

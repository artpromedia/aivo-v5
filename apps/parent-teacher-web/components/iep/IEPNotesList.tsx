'use client';

import { useState, useMemo } from 'react';
import { MessageSquare, User, Eye, EyeOff, Plus } from 'lucide-react';
import type { IEPNote } from '../../types/iep';
import { formatDate, formatRelativeDate } from '../../types/iep';

// ============================================================================
// Types
// ============================================================================

interface IEPNotesListProps {
  notes: IEPNote[];
  isTeacher?: boolean;
  onAddNote?: () => void;
  maxItems?: number;
}

type NoteType = 'observation' | 'strategy' | 'concern' | 'celebration' | 'general';

// ============================================================================
// Note Type Configuration
// ============================================================================

const NOTE_TYPE_CONFIG: Record<
  NoteType,
  { label: string; emoji: string; color: string; bgColor: string }
> = {
  observation: { label: 'Observation', emoji: '👁️', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  strategy: { label: 'Strategy', emoji: '💡', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  concern: { label: 'Concern', emoji: '⚠️', color: 'text-red-600', bgColor: 'bg-red-50' },
  celebration: {
    label: 'Celebration',
    emoji: '🎉',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  general: { label: 'Note', emoji: '📝', color: 'text-gray-600', bgColor: 'bg-gray-50' },
};

// ============================================================================
// Role Configuration
// ============================================================================

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  teacher: { label: 'Teacher', color: 'text-violet-600' },
  parent: { label: 'Parent', color: 'text-emerald-600' },
  therapist: { label: 'Therapist', color: 'text-cyan-600' },
  admin: { label: 'Admin', color: 'text-gray-600' },
};

// ============================================================================
// Helper to detect note type from content
// ============================================================================

function detectNoteType(content: string): NoteType {
  const lower = content.toLowerCase();
  if (lower.includes('observe') || lower.includes('noticed') || lower.includes('saw')) {
    return 'observation';
  }
  if (lower.includes('try') || lower.includes('strategy') || lower.includes('suggest')) {
    return 'strategy';
  }
  if (lower.includes('concern') || lower.includes('worried') || lower.includes('struggling')) {
    return 'concern';
  }
  if (
    lower.includes('great') ||
    lower.includes('amazing') ||
    lower.includes('celebrate') ||
    lower.includes('proud')
  ) {
    return 'celebration';
  }
  return 'general';
}

// ============================================================================
// Single Note Item
// ============================================================================

interface NoteItemProps {
  note: IEPNote;
  isTeacher: boolean;
}

function NoteItem({ note, isTeacher }: NoteItemProps) {
  const noteType = detectNoteType(note.content);
  const typeConfig = NOTE_TYPE_CONFIG[noteType];
  const roleConfig = ROLE_CONFIG[note.authorRole ?? 'teacher'];
  const [isPrivate] = useState(false); // TODO: Add privacy field to IEPNote type

  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Type badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}
        >
          <span>{typeConfig.emoji}</span>
          <span>{typeConfig.label}</span>
        </div>

        {/* Privacy indicator */}
        {isTeacher && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {isPrivate ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Staff only</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Parent visible</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-gray-700 leading-relaxed mb-3">{note.content}</p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5" />
          <span className={roleConfig.color}>{note.createdBy}</span>
          <span>•</span>
          <span>{roleConfig.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{formatDate(note.createdAt)}</span>
          <span className="text-gray-300">•</span>
          <span>{formatRelativeDate(note.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Notes List Component
// ============================================================================

export function IEPNotesList({ notes, isTeacher = false, onAddNote, maxItems }: IEPNotesListProps) {
  const [showAll, setShowAll] = useState(false);

  // Sort notes by date (newest first)
  const sortedNotes = useMemo(() => {
    return [...notes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [notes]);

  // Apply max items limit
  const displayedNotes = useMemo(() => {
    if (!maxItems || showAll) return sortedNotes;
    return sortedNotes.slice(0, maxItems);
  }, [sortedNotes, maxItems, showAll]);

  const hasMore = maxItems && sortedNotes.length > maxItems;

  // Empty state
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No notes yet</h3>
        <p className="text-sm text-gray-500 mb-4">Add observations, strategies, or celebrations</p>
        {isTeacher && onAddNote && (
          <button
            onClick={onAddNote}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add note button for teachers */}
      {isTeacher && onAddNote && (
        <button
          onClick={onAddNote}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Note</span>
        </button>
      )}

      {/* Notes list */}
      {displayedNotes.map((note) => (
        <NoteItem key={note.id} note={note} isTeacher={isTeacher} />
      ))}

      {/* Show more/less button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-3 text-sm font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-colors"
        >
          {showAll ? 'Show less' : `Show ${sortedNotes.length - maxItems} more`}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

export function IEPNotesListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-6 w-24 bg-gray-100 rounded-full" />
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

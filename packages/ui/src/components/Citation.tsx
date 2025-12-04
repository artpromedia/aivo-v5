import { forwardRef, HTMLAttributes, useState } from 'react';
import { cn } from '../utils';

export interface CitationSource {
  /** Unique identifier */
  id: string;
  /** Type of source */
  type: 'topic' | 'content_item';
  /** Source title */
  title: string;
  /** Subject area */
  subject: string;
  /** Grade level */
  grade: number;
  /** Preview of the content */
  bodyPreview?: string;
  /** Content type for items */
  contentType?: string;
  /** Curriculum standard code */
  standardCode?: string;
  /** Relevance score (0-1) */
  score?: number;
}

export interface CitationProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of sources to display */
  sources: CitationSource[];
  /** Whether to show expanded details by default */
  defaultExpanded?: boolean;
  /** Maximum number of sources to show before "show more" */
  maxVisible?: number;
  /** Callback when a source is clicked */
  onSourceClick?: (source: CitationSource) => void;
  /** Whether to show relevance scores */
  showScores?: boolean;
  /** Visual variant */
  variant?: 'inline' | 'card' | 'minimal';
}

/**
 * Citation component to display source content for AI-generated responses.
 *
 * Shows curriculum sources that were used to generate learner responses,
 * providing transparency and allowing verification of information.
 *
 * @example
 * ```tsx
 * <Citation
 *   sources={[
 *     {
 *       id: 'topic-1',
 *       type: 'topic',
 *       title: 'Understanding Fractions',
 *       subject: 'math',
 *       grade: 5,
 *       score: 0.89
 *     }
 *   ]}
 *   onSourceClick={(source) => navigate(`/content/${source.id}`)}
 * />
 * ```
 */
export const Citation = forwardRef<HTMLDivElement, CitationProps>(
  (
    {
      sources,
      defaultExpanded = false,
      maxVisible = 3,
      onSourceClick,
      showScores = false,
      variant = 'card',
      className,
      ...props
    },
    ref,
  ) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    if (!sources || sources.length === 0) {
      return null;
    }

    const visibleSources = isExpanded ? sources : sources.slice(0, maxVisible);
    const hasMore = sources.length > maxVisible;

    const getSubjectEmoji = (subject: string): string => {
      const emojis: Record<string, string> = {
        math: '🔢',
        ela: '📚',
        science: '🔬',
        social_studies: '🌍',
        art: '🎨',
        music: '🎵',
        pe: '⚽',
        default: '📄',
      };
      return emojis[subject.toLowerCase()] || emojis.default;
    };

    const getTypeLabel = (type: string, contentType?: string): string => {
      if (type === 'topic') return 'Topic';
      if (contentType) {
        const labels: Record<string, string> = {
          explanation: 'Explanation',
          example: 'Example',
          practice: 'Practice',
          assessment: 'Assessment',
        };
        return labels[contentType] || contentType;
      }
      return 'Content';
    };

    const formatScore = (score?: number): string => {
      if (score === undefined) return '';
      return `${Math.round(score * 100)}%`;
    };

    if (variant === 'minimal') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center gap-2 text-sm text-[rgb(var(--color-text-muted,148_163_184))]',
            className,
          )}
          {...props}
        >
          <span className="text-xs">📎</span>
          <span>
            {sources.length} source{sources.length !== 1 ? 's' : ''}
          </span>
        </div>
      );
    }

    if (variant === 'inline') {
      return (
        <div
          ref={ref}
          className={cn('inline-flex flex-wrap items-center gap-2', className)}
          {...props}
        >
          <span className="text-xs text-[rgb(var(--color-text-muted,148_163_184))]">Sources:</span>
          {visibleSources.map((source) => (
            <button
              key={source.id}
              onClick={() => onSourceClick?.(source)}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5',
                'text-xs rounded-full',
                'bg-[rgb(var(--color-primary,124_58_237))]/10',
                'text-[rgb(var(--color-primary,124_58_237))]',
                'hover:bg-[rgb(var(--color-primary,124_58_237))]/20',
                'transition-colors cursor-pointer',
                'focus:outline-none focus-visible:ring-2',
                'focus-visible:ring-[rgb(var(--color-primary,124_58_237))]',
              )}
            >
              <span>{getSubjectEmoji(source.subject)}</span>
              <span className="max-w-32 truncate">{source.title}</span>
            </button>
          ))}
          {!isExpanded && hasMore && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-[rgb(var(--color-primary,124_58_237))] hover:underline"
            >
              +{sources.length - maxVisible} more
            </button>
          )}
        </div>
      );
    }

    // Card variant (default)
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-[rgb(var(--color-border,203_213_225))]',
          'bg-[rgb(var(--color-surface,248_250_252))]',
          'overflow-hidden',
          className,
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--color-border,203_213_225))]">
          <div className="flex items-center gap-2">
            <span className="text-sm">📎</span>
            <h4 className="text-sm font-medium text-[rgb(var(--color-text,15_23_42))]">Sources</h4>
            <span className="text-xs text-[rgb(var(--color-text-muted,148_163_184))]">
              ({sources.length})
            </span>
          </div>
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-[rgb(var(--color-primary,124_58_237))] hover:underline"
            >
              {isExpanded ? 'Show less' : `Show all ${sources.length}`}
            </button>
          )}
        </div>

        {/* Source list */}
        <div className="divide-y divide-[rgb(var(--color-border,203_213_225))]">
          {visibleSources.map((source) => (
            <button
              key={source.id}
              onClick={() => onSourceClick?.(source)}
              className={cn(
                'w-full text-left px-4 py-3',
                'hover:bg-[rgb(var(--color-primary,124_58_237))]/5',
                'transition-colors cursor-pointer',
                'focus:outline-none focus-visible:bg-[rgb(var(--color-primary,124_58_237))]/10',
              )}
            >
              <div className="flex items-start gap-3">
                {/* Subject emoji */}
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {getSubjectEmoji(source.subject)}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[rgb(var(--color-text,15_23_42))] truncate">
                      {source.title}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--color-primary,124_58_237))]/10 text-[rgb(var(--color-primary,124_58_237))]">
                      {getTypeLabel(source.type, source.contentType)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[rgb(var(--color-text-muted,148_163_184))]">
                      Grade {source.grade} • {source.subject}
                    </span>
                    {source.standardCode && (
                      <span className="text-xs text-[rgb(var(--color-text-muted,148_163_184))]">
                        • {source.standardCode}
                      </span>
                    )}
                    {showScores && source.score !== undefined && (
                      <span className="text-xs font-medium text-[rgb(var(--color-success,34_197_94))]">
                        {formatScore(source.score)} match
                      </span>
                    )}
                  </div>

                  {source.bodyPreview && (
                    <p className="text-xs text-[rgb(var(--color-text-muted,148_163_184))] mt-1 line-clamp-2">
                      {source.bodyPreview}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <span className="text-[rgb(var(--color-text-muted,148_163_184))] flex-shrink-0">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  },
);

Citation.displayName = 'Citation';

export default Citation;

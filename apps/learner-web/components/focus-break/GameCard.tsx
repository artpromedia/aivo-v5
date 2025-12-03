'use client';

import { Clock } from 'lucide-react';

export interface GameConfig {
  id: string;
  name: string;
  description: string;
  emoji: string;
  duration: number; // in seconds
  color: 'primary' | 'mint' | 'sky' | 'sunshine' | 'coral';
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GameCardProps {
  game: GameConfig;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * GameCard component for displaying game options in selection grid
 */
export function GameCard({ game, isSelected, onSelect }: GameCardProps) {
  // Color mappings
  const colorClasses = {
    primary: {
      bg: 'bg-theme-primary/10',
      border: 'border-theme-primary',
      shadow: 'shadow-theme-primary/20',
      text: 'text-theme-primary',
    },
    mint: {
      bg: 'bg-mint/15',
      border: 'border-mint',
      shadow: 'shadow-mint/20',
      text: 'text-mint-dark',
    },
    sky: {
      bg: 'bg-sky/15',
      border: 'border-sky',
      shadow: 'shadow-sky/20',
      text: 'text-sky-dark',
    },
    sunshine: {
      bg: 'bg-sunshine/15',
      border: 'border-sunshine',
      shadow: 'shadow-sunshine/20',
      text: 'text-sunshine-dark',
    },
    coral: {
      bg: 'bg-coral/15',
      border: 'border-coral',
      shadow: 'shadow-coral/20',
      text: 'text-coral-dark',
    },
  };

  const colors = colorClasses[game.color];

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Difficulty badge colors
  const difficultyColors = {
    easy: 'bg-mint/20 text-mint-dark',
    medium: 'bg-sunshine/20 text-sunshine-dark',
    hard: 'bg-coral/20 text-coral-dark',
  };

  return (
    <button
      onClick={onSelect}
      className={`
        relative w-full p-4 rounded-2xl
        bg-white border-2 transition-all duration-200
        hover:shadow-lg hover:-translate-y-1
        active:translate-y-0 active:shadow-md
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2
        ${
          isSelected
            ? `${colors.border} shadow-lg ${colors.shadow}`
            : 'border-transparent shadow-card'
        }
      `}
      aria-pressed={isSelected}
      aria-label={`${game.name}: ${game.description}. Duration: ${formatDuration(game.duration)}`}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className={`w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center`}>
            <svg
              className={`w-3 h-3 ${colors.text}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Icon container */}
      <div
        className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center mx-auto mb-3`}
      >
        <span className="text-3xl">{game.emoji}</span>
      </div>

      {/* Game name */}
      <h3 className="font-bold text-theme-text text-center mb-1">{game.name}</h3>

      {/* Description */}
      <p className="text-xs text-theme-text-muted text-center mb-3 line-clamp-2">
        {game.description}
      </p>

      {/* Footer with duration and difficulty */}
      <div className="flex items-center justify-center gap-2">
        <span className={`inline-flex items-center gap-1 text-xs ${colors.text}`}>
          <Clock className="w-3 h-3" />
          {formatDuration(game.duration)}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[game.difficulty]}`}>
          {game.difficulty}
        </span>
      </div>
    </button>
  );
}

export default GameCard;

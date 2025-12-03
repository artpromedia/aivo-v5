'use client';

import { useEffect, useState } from 'react';
import { Star, Trophy, Zap } from 'lucide-react';

interface ScoreDisplayProps {
  /** Current score */
  score: number;
  /** Optional label */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show animation on score change */
  animate?: boolean;
  /** Icon type */
  icon?: 'star' | 'trophy' | 'zap';
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning';
}

/**
 * ScoreDisplay component for showing game scores with animations
 */
export function ScoreDisplay({
  score,
  label = 'Score',
  size = 'md',
  animate = true,
  icon = 'star',
  variant = 'primary',
}: ScoreDisplayProps) {
  const [displayScore, setDisplayScore] = useState(score);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate score changes
  useEffect(() => {
    if (!animate || score === displayScore) return;

    setIsAnimating(true);

    // Animate counting up
    const diff = score - displayScore;
    const steps = Math.min(Math.abs(diff), 10);
    const stepValue = diff / steps;
    let current = displayScore;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplayScore(score);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        current += stepValue;
        setDisplayScore(Math.round(current));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [score, displayScore, animate]);

  // Size classes
  const sizeClasses = {
    sm: 'text-sm px-2.5 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const scoreSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  // Variant colors
  const variantClasses = {
    primary: 'bg-theme-primary/10 text-theme-primary',
    success: 'bg-mint/20 text-mint-dark',
    warning: 'bg-sunshine/20 text-sunshine-dark',
  };

  // Icon component
  const IconComponent = {
    star: Star,
    trophy: Trophy,
    zap: Zap,
  }[icon];

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-full font-medium
        transition-all duration-300
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isAnimating ? 'scale-110' : 'scale-100'}
      `}
      role="status"
      aria-label={`${label}: ${displayScore}`}
    >
      <IconComponent
        className={`
          ${iconSizes[size]}
          ${isAnimating ? 'animate-bounce' : ''}
        `}
      />
      <span className="text-theme-text-muted">{label}:</span>
      <span className={`font-bold tabular-nums ${scoreSizes[size]}`}>{displayScore}</span>

      {/* Score pop animation */}
      {isAnimating && (
        <span className="absolute -top-2 -right-2 text-xs font-bold text-theme-success animate-ping">
          +{score - (displayScore - (score - displayScore))}
        </span>
      )}
    </div>
  );
}

/**
 * Final score display for game completion
 */
interface FinalScoreProps {
  score: number;
  maxScore?: number;
  message?: string;
}

export function FinalScore({ score, maxScore, message }: FinalScoreProps) {
  const percentage = maxScore ? Math.round((score / maxScore) * 100) : null;

  const getEmoji = () => {
    if (!percentage) return '🌟';
    if (percentage >= 90) return '🏆';
    if (percentage >= 70) return '⭐';
    if (percentage >= 50) return '👍';
    return '💪';
  };

  const getMessage = () => {
    if (message) return message;
    if (!percentage) return 'Great job!';
    if (percentage >= 90) return 'Amazing! Perfect score!';
    if (percentage >= 70) return 'Excellent work!';
    if (percentage >= 50) return 'Good effort!';
    return 'Keep practicing!';
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Trophy/Star container */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sunshine/30 to-mint/30 flex items-center justify-center">
          <span className="text-5xl animate-bounce">{getEmoji()}</span>
        </div>
        {/* Sparkles */}
        <div className="absolute -top-2 -right-2 text-2xl animate-pulse">✨</div>
        <div className="absolute -bottom-1 -left-2 text-xl animate-pulse delay-100">✨</div>
      </div>

      {/* Score */}
      <div className="text-center">
        <div className="text-4xl font-bold text-theme-text">{score}</div>
        {maxScore && <div className="text-sm text-theme-text-muted">out of {maxScore} points</div>}
      </div>

      {/* Message */}
      <p className="text-lg font-medium text-theme-text-secondary text-center">{getMessage()}</p>

      {/* Progress bar if max score exists */}
      {maxScore && (
        <div className="w-full max-w-xs">
          <div className="h-3 bg-theme-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-theme-primary to-mint rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-center text-sm text-theme-text-muted mt-1">{percentage}%</div>
        </div>
      )}
    </div>
  );
}

export default ScoreDisplay;

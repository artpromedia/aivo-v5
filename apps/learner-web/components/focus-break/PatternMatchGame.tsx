'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameTimer } from './GameTimer';
import { ScoreDisplay } from './ScoreDisplay';
import { Check, X } from 'lucide-react';

interface PatternMatchGameProps {
  /** Duration in seconds */
  duration?: number;
  /** Difficulty level affects grid size and pattern complexity */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** Callback when game completes */
  onComplete: (score: number) => void;
  /** Callback for score updates */
  onScoreUpdate?: (score: number) => void;
}

// Pattern cell types
type CellState = 'hidden' | 'showing' | 'selected' | 'correct' | 'incorrect';

interface Cell {
  id: number;
  isPartOfPattern: boolean;
  state: CellState;
}

// Encouraging messages
const CORRECT_MESSAGES = [
  'Great job! 🎉',
  'You got it! ⭐',
  'Perfect! 🌟',
  'Amazing memory! 🧠',
  'Excellent! 💫',
];

const INCORRECT_MESSAGES = [
  'Almost! Try again 💪',
  'Keep trying! 🌈',
  'You can do it! ✨',
  'So close! 🎯',
];

/**
 * PatternMatchGame - Visual pattern recognition mini-game
 * Players must memorize and recreate a pattern shown briefly
 */
export function PatternMatchGame({
  duration = 45,
  difficulty = 'easy',
  onComplete,
  onScoreUpdate,
}: PatternMatchGameProps) {
  // Game configuration based on difficulty
  const config = useMemo(
    () =>
      ({
        easy: { gridSize: 3, patternSize: 3, showTime: 2000 },
        medium: { gridSize: 4, patternSize: 4, showTime: 1500 },
        hard: { gridSize: 5, patternSize: 5, showTime: 1200 },
      })[difficulty],
    [difficulty],
  );

  const [cells, setCells] = useState<Cell[]>([]);
  const [phase, setPhase] = useState<'showing' | 'playing' | 'feedback'>('showing');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [selectedCount, setSelectedCount] = useState(0);
  const [message, setMessage] = useState('Watch the pattern!');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Ref to track if initialized
  const hasInitialized = useRef(false);

  // Store callbacks in refs to avoid dependency issues
  const onScoreUpdateRef = useRef(onScoreUpdate);
  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
  }, [onScoreUpdate]);

  // Generate a new pattern
  const generatePattern = useCallback(() => {
    const totalCells = config.gridSize * config.gridSize;
    const newCells: Cell[] = Array.from({ length: totalCells }, (_, i) => ({
      id: i,
      isPartOfPattern: false,
      state: 'hidden' as CellState,
    }));

    // Randomly select cells for the pattern
    const patternIndices = new Set<number>();
    while (patternIndices.size < config.patternSize) {
      patternIndices.add(Math.floor(Math.random() * totalCells));
    }

    patternIndices.forEach((index) => {
      newCells[index].isPartOfPattern = true;
      newCells[index].state = 'showing';
    });

    return newCells;
  }, [config]);

  // Start new round function
  const startNewRound = useCallback(() => {
    const newCells = generatePattern();
    setCells(newCells);
    setPhase('showing');
    setSelectedCount(0);
    setMessage('Watch the pattern!');

    // Show pattern briefly, then hide
    setTimeout(() => {
      setCells((prev) =>
        prev.map((cell) => ({
          ...cell,
          state: 'hidden' as CellState,
        })),
      );
      setPhase('playing');
      setMessage('Now recreate the pattern!');
      setIsTimerRunning(true);
    }, config.showTime);
  }, [generatePattern, config.showTime]);

  // Initialize game on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      startNewRound();
    }
  }, [startNewRound]);

  // Handle cell click
  const handleCellClick = useCallback(
    (cellId: number) => {
      if (phase !== 'playing' || gameOver) return;

      setCells((prev) => {
        const newCells = [...prev];
        const cell = newCells[cellId];

        if (cell.state !== 'hidden') return prev;

        const isCorrect = cell.isPartOfPattern;
        cell.state = isCorrect ? 'correct' : 'incorrect';

        if (isCorrect) {
          setSelectedCount((c) => c + 1);
          setScore((s) => {
            const newScore = s + 10;
            onScoreUpdateRef.current?.(newScore);
            return newScore;
          });
        }

        return newCells;
      });
    },
    [phase, gameOver],
  );

  // Check if round is complete
  useEffect(() => {
    if (phase !== 'playing') return;

    const correctSelected = cells.filter((c) => c.state === 'correct').length;
    const incorrectSelected = cells.filter((c) => c.state === 'incorrect').length;

    // All pattern cells found
    if (correctSelected === config.patternSize) {
      setPhase('feedback');
      setIsTimerRunning(false);
      const randomMessage = CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
      setMessage(randomMessage);

      // Bonus points for no mistakes
      if (incorrectSelected === 0) {
        setScore((s) => {
          const newScore = s + 20;
          onScoreUpdateRef.current?.(newScore);
          return newScore;
        });
      }

      // Start next round after delay
      setTimeout(() => {
        setRound((r) => r + 1);
        startNewRound();
      }, 1500);
    }

    // Too many mistakes
    if (incorrectSelected >= 3) {
      setPhase('feedback');
      const randomMessage =
        INCORRECT_MESSAGES[Math.floor(Math.random() * INCORRECT_MESSAGES.length)];
      setMessage(randomMessage);

      // Show correct pattern
      setCells((prev) =>
        prev.map((cell) => ({
          ...cell,
          state: cell.isPartOfPattern ? 'showing' : cell.state,
        })),
      );

      setTimeout(() => {
        startNewRound();
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, phase, config.patternSize]);

  // Handle timer complete
  const handleTimerComplete = useCallback(() => {
    setGameOver(true);
    setIsTimerRunning(false);
    onComplete(score);
  }, [score, onComplete]);

  // Get cell style based on state
  const getCellStyle = (cell: Cell) => {
    switch (cell.state) {
      case 'showing':
        return 'bg-gradient-to-br from-theme-primary to-theme-primary-dark scale-95';
      case 'correct':
        return 'bg-mint scale-95';
      case 'incorrect':
        return 'bg-coral/70 scale-95';
      case 'selected':
        return 'bg-theme-primary/50';
      default:
        return 'bg-white hover:bg-theme-surface active:scale-95';
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header with timer and score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GameTimer
            duration={duration}
            isRunning={isTimerRunning}
            onComplete={handleTimerComplete}
            size="md"
          />
          <span className="text-sm text-theme-text-muted">Round {round}</span>
        </div>
        <ScoreDisplay score={score} icon="star" variant="primary" />
      </div>

      {/* Message */}
      <div
        className={`
        text-center py-3 px-4 rounded-xl mb-4 transition-all duration-300
        ${phase === 'showing' ? 'bg-sky/20 text-sky-dark' : ''}
        ${phase === 'playing' ? 'bg-theme-primary/10 text-theme-primary' : ''}
        ${
          phase === 'feedback' && message.includes('!') && !message.includes('Almost')
            ? 'bg-mint/20 text-mint-dark'
            : phase === 'feedback'
              ? 'bg-sunshine/20 text-sunshine-dark'
              : ''
        }
      `}
      >
        <p className="font-medium text-lg">{message}</p>
        {phase === 'playing' && (
          <p className="text-sm text-theme-text-muted mt-1">
            Find {config.patternSize - selectedCount} more tiles
          </p>
        )}
      </div>

      {/* Game Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="grid gap-2 w-full max-w-xs aspect-square"
          style={{
            gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
          }}
        >
          {cells.map((cell) => (
            <button
              key={cell.id}
              onClick={() => handleCellClick(cell.id)}
              disabled={phase !== 'playing' || cell.state !== 'hidden'}
              className={`
                aspect-square rounded-xl
                shadow-card transition-all duration-200
                flex items-center justify-center
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary
                ${getCellStyle(cell)}
                ${
                  phase === 'playing' && cell.state === 'hidden'
                    ? 'cursor-pointer'
                    : 'cursor-default'
                }
              `}
              aria-label={`Cell ${cell.id + 1}`}
            >
              {cell.state === 'correct' && <Check className="w-6 h-6 text-white" />}
              {cell.state === 'incorrect' && <X className="w-6 h-6 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-theme-text-muted">
        <p>💡 Memorize the highlighted pattern, then tap to recreate it!</p>
      </div>
    </div>
  );
}

export default PatternMatchGame;

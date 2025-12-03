'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw, ArrowRight, Brain } from 'lucide-react';
import {
  GameCard,
  GameConfig,
  PatternMatchGame,
  WordScrambleGame,
  QuickMathGame,
} from '../../components/focus-break';

// Game configurations
const GAMES: GameConfig[] = [
  {
    id: 'pattern-match',
    name: 'Pattern Match',
    description: 'Memorize and recreate visual patterns',
    emoji: '🧩',
    duration: 45,
    color: 'primary',
    difficulty: 'easy',
  },
  {
    id: 'word-scramble',
    name: 'Word Scramble',
    description: 'Unscramble letters to form words',
    emoji: '🔤',
    duration: 60,
    color: 'coral',
    difficulty: 'easy',
  },
  {
    id: 'quick-math',
    name: 'Quick Math',
    description: 'Solve math problems against the clock',
    emoji: '🔢',
    duration: 45,
    color: 'sunshine',
    difficulty: 'easy',
  },
];

// Game states
type GameState = 'selection' | 'playing' | 'completed';

/**
 * Focus Break Page
 * Provides educational mini-games for brain breaks
 */
export default function FocusBreakPage() {
  const router = useRouter();

  // State
  const [gameState, setGameState] = useState<GameState>('selection');
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [breakStartTime] = useState<Date>(() => new Date());
  const [breakDuration, setBreakDuration] = useState(0);

  // Handle game selection
  const handleSelectGame = useCallback((game: GameConfig) => {
    setSelectedGame(game);
  }, []);

  // Start the selected game
  const handleStartGame = useCallback(() => {
    if (!selectedGame) return;
    setGameState('playing');
    setCurrentScore(0);
  }, [selectedGame]);

  // Handle game completion
  const handleGameComplete = useCallback(
    (score: number) => {
      setFinalScore(score);
      setGameState('completed');

      // Calculate break duration
      const duration = Math.round((Date.now() - breakStartTime.getTime()) / 1000);
      setBreakDuration(duration);

      // Log completion (for future focus monitor integration)
      console.log('[Focus Break] Game completed:', {
        gameId: selectedGame?.id,
        score,
        duration,
        timestamp: new Date().toISOString(),
      });
    },
    [breakStartTime, selectedGame],
  );

  // Handle score updates during gameplay
  const handleScoreUpdate = useCallback((score: number) => {
    setCurrentScore(score);
  }, []);

  // Play another game
  const handlePlayAnother = useCallback(() => {
    setGameState('selection');
    setSelectedGame(null);
    setFinalScore(0);
    setCurrentScore(0);
    setBreakStartTime(new Date());
  }, []);

  // Return to learning
  const handleReturnToLearning = useCallback(() => {
    router.push('/session');
  }, [router]);

  // Render based on game state
  const renderContent = () => {
    switch (gameState) {
      case 'selection':
        return (
          <GameSelectionView
            games={GAMES}
            selectedGame={selectedGame}
            onSelectGame={handleSelectGame}
            onStartGame={handleStartGame}
          />
        );
      case 'playing':
        return (
          selectedGame && (
            <GamePlayView
              game={selectedGame}
              score={currentScore}
              onComplete={handleGameComplete}
              onScoreUpdate={handleScoreUpdate}
              onExit={() => setGameState('selection')}
            />
          )
        );
      case 'completed':
        return (
          <GameCompletionView
            game={selectedGame!}
            score={finalScore}
            duration={breakDuration}
            onPlayAnother={handlePlayAnother}
            onReturnToLearning={handleReturnToLearning}
          />
        );
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-mint/10 via-sky/5 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-theme-surface-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl hover:bg-theme-surface transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-theme-text-muted" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-theme-text">Brain Break</h1>
            <p className="text-xs text-theme-text-muted">
              {gameState === 'selection' && 'Pick a fun activity!'}
              {gameState === 'playing' && selectedGame?.name}
              {gameState === 'completed' && 'Great job!'}
            </p>
          </div>
          {gameState === 'playing' && (
            <div className="px-3 py-1.5 bg-theme-primary/10 rounded-full">
              <span className="text-sm font-bold text-theme-primary">Score: {currentScore}</span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-lg mx-auto">{renderContent()}</div>
    </main>
  );
}

// ==================== Game Selection View ====================

interface GameSelectionViewProps {
  games: GameConfig[];
  selectedGame: GameConfig | null;
  onSelectGame: (game: GameConfig) => void;
  onStartGame: () => void;
}

function GameSelectionView({
  games,
  selectedGame,
  onSelectGame,
  onStartGame,
}: GameSelectionViewProps) {
  return (
    <div className="p-4 space-y-6">
      {/* Encouraging message */}
      <div className="bg-gradient-to-r from-mint/20 to-sky/20 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-white rounded-xl shadow-card flex items-center justify-center">
          <span className="text-3xl">🧠</span>
        </div>
        <div>
          <h2 className="font-bold text-theme-text text-lg">Time for a brain break!</h2>
          <p className="text-sm text-theme-text-secondary">
            A quick break helps you learn better. Pick an activity!
          </p>
        </div>
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-1 gap-4">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            isSelected={selectedGame?.id === game.id}
            onSelect={() => onSelectGame(game)}
          />
        ))}
      </div>

      {/* Start button */}
      {selectedGame && (
        <button
          onClick={onStartGame}
          className="w-full py-4 rounded-2xl font-semibold text-lg
            bg-gradient-to-r from-theme-primary to-theme-primary-dark
            text-white shadow-soft-primary
            hover:shadow-lg active:scale-[0.98]
            transition-all duration-200
            flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          Play {selectedGame.name}
        </button>
      )}

      {/* Skip break option */}
      <Link
        href="/session"
        className="block text-center text-sm text-theme-text-muted hover:text-theme-primary transition-colors"
      >
        Skip break and continue learning →
      </Link>
    </div>
  );
}

// ==================== Game Play View ====================

interface GamePlayViewProps {
  game: GameConfig;
  score: number;
  onComplete: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onExit: () => void;
}

function GamePlayView({ game, onComplete, onScoreUpdate, onExit }: GamePlayViewProps) {
  // Render appropriate game component
  const renderGame = () => {
    switch (game.id) {
      case 'pattern-match':
        return (
          <PatternMatchGame
            duration={game.duration}
            difficulty={game.difficulty}
            onComplete={onComplete}
            onScoreUpdate={onScoreUpdate}
          />
        );
      case 'word-scramble':
        return (
          <WordScrambleGame
            duration={game.duration}
            difficulty={game.difficulty}
            onComplete={onComplete}
            onScoreUpdate={onScoreUpdate}
          />
        );
      case 'quick-math':
        return (
          <QuickMathGame
            duration={game.duration}
            difficulty={game.difficulty}
            onComplete={onComplete}
            onScoreUpdate={onScoreUpdate}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <span className="text-6xl mb-4">{game.emoji}</span>
            <p className="text-theme-text-muted">Game not found</p>
            <button
              onClick={onExit}
              className="mt-4 px-4 py-2 rounded-xl bg-theme-surface text-theme-text"
            >
              Go Back
            </button>
          </div>
        );
    }
  };

  return <div className="h-[calc(100vh-120px)]">{renderGame()}</div>;
}

// ==================== Game Completion View ====================

interface GameCompletionViewProps {
  game: GameConfig;
  score: number;
  duration: number;
  onPlayAnother: () => void;
  onReturnToLearning: () => void;
}

function GameCompletionView({
  game,
  score,
  duration,
  onPlayAnother,
  onReturnToLearning,
}: GameCompletionViewProps) {
  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} seconds`;
    return `${mins}m ${secs}s`;
  };

  // Get encouraging message based on score
  const getMessage = () => {
    if (score >= 100) return "Amazing! You're a superstar! 🌟";
    if (score >= 70) return 'Excellent work! Keep it up! 🎉';
    if (score >= 50) return 'Great effort! Well done! 👏';
    return 'Good try! Practice makes perfect! 💪';
  };

  return (
    <div className="p-6 flex flex-col items-center text-center">
      {/* Star container */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-mint/30 to-sky/30 flex items-center justify-center">
          <span className="text-6xl animate-bounce">🌟</span>
        </div>
        {/* Sparkles */}
        <div className="absolute -top-2 -right-2 text-2xl animate-pulse">✨</div>
        <div className="absolute -bottom-1 -left-2 text-xl animate-pulse">✨</div>
        <div className="absolute top-1/2 -right-6 text-lg animate-pulse delay-100">⭐</div>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-theme-text mb-2">Great Break!</h2>

      {/* Score */}
      <div className="text-5xl font-bold text-theme-primary mb-2">{score}</div>
      <p className="text-theme-text-muted mb-4">points earned</p>

      {/* Message */}
      <p className="text-lg text-theme-text-secondary mb-6">{getMessage()}</p>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-8 text-sm text-theme-text-muted">
        <div className="flex items-center gap-2">
          <span className="text-xl">{game.emoji}</span>
          <span>{game.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Brain refresh message */}
      <div className="bg-mint/15 rounded-2xl px-5 py-4 mb-8 max-w-xs">
        <p className="text-mint-dark font-medium">
          Your brain is refreshed and ready to learn! 🧠✨
        </p>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onReturnToLearning}
          className="w-full py-4 rounded-2xl font-semibold text-lg
            bg-gradient-to-r from-theme-primary to-theme-primary-dark
            text-white shadow-soft-primary
            hover:shadow-lg active:scale-[0.98]
            transition-all duration-200
            flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-5 h-5" />
          Back to Learning
        </button>

        <button
          onClick={onPlayAnother}
          className="w-full py-3 rounded-xl font-medium
            bg-theme-surface text-theme-text
            hover:bg-theme-surface-border active:scale-[0.98]
            transition-all duration-200
            flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Play Another Game
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameTimer } from './GameTimer';
import { ScoreDisplay } from './ScoreDisplay';
import { Check, X } from 'lucide-react';

interface QuickMathGameProps {
  /** Duration in seconds */
  duration?: number;
  /** Difficulty level affects number ranges and operations */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** Callback when game completes */
  onComplete: (score: number) => void;
  /** Callback for score updates */
  onScoreUpdate?: (score: number) => void;
}

interface MathProblem {
  question: string;
  answer: number;
  options: number[];
}

// Streak messages for consecutive correct answers
const STREAK_MESSAGES = ['Nice streak! 🔥', "You're on fire! 🔥🔥", 'Unstoppable! 🔥🔥🔥'];

/**
 * QuickMathGame - Fast-paced math problems
 */
export function QuickMathGame({
  duration = 45,
  difficulty = 'easy',
  onComplete,
  onScoreUpdate,
}: QuickMathGameProps) {
  // Game state
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [problemsAnswered, setProblemsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Configuration based on difficulty
  const config = useMemo(
    () =>
      ({
        easy: { maxNum: 10, operations: ['+', '-'] },
        medium: { maxNum: 20, operations: ['+', '-', '×'] },
        hard: { maxNum: 50, operations: ['+', '-', '×', '÷'] },
      })[difficulty],
    [difficulty],
  );

  // Generate a math problem
  const generateProblem = useCallback((): MathProblem => {
    const operation = config.operations[Math.floor(Math.random() * config.operations.length)];
    let num1: number, num2: number, answer: number;

    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * config.maxNum) + 1;
        num2 = Math.floor(Math.random() * config.maxNum) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * config.maxNum) + 1;
        num2 = Math.floor(Math.random() * num1) + 1; // Ensure positive result
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        break;
      case '÷':
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = Math.floor(Math.random() * 10) + 1;
        num1 = num2 * answer; // Ensure clean division
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }

    // Generate wrong options
    const options = new Set<number>([answer]);
    while (options.size < 4) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const wrongAnswer = answer + (offset === 0 ? 1 : offset);
      if (wrongAnswer > 0) {
        options.add(wrongAnswer);
      }
    }

    // Shuffle options
    const shuffledOptions = [...options].sort(() => Math.random() - 0.5);

    return {
      question: `${num1} ${operation} ${num2} = ?`,
      answer,
      options: shuffledOptions,
    };
  }, [config]);

  // Initialize first problem
  useEffect(() => {
    setCurrentProblem(generateProblem());
  }, [generateProblem]);

  // Handle answer selection
  const handleAnswer = useCallback(
    (option: number) => {
      if (feedback || !currentProblem) return;

      setSelectedOption(option);
      const isCorrect = option === currentProblem.answer;
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      setProblemsAnswered((p) => p + 1);

      if (isCorrect) {
        const streakBonus = streak >= 2 ? Math.min(streak * 2, 10) : 0;
        const points = 10 + streakBonus;

        setScore((s) => {
          const newScore = s + points;
          onScoreUpdate?.(newScore);
          return newScore;
        });
        setStreak((s) => s + 1);
        setCorrectAnswers((c) => c + 1);
      } else {
        setStreak(0);
      }

      // Move to next problem after delay
      setTimeout(() => {
        setCurrentProblem(generateProblem());
        setFeedback(null);
        setSelectedOption(null);
      }, 800);
    },
    [feedback, currentProblem, streak, generateProblem, onScoreUpdate],
  );

  // Handle timer complete
  const handleTimerComplete = useCallback(() => {
    setIsTimerRunning(false);
    onComplete(score);
  }, [score, onComplete]);

  // Get option button style
  const getOptionStyle = (option: number) => {
    if (feedback === null) {
      return 'bg-white hover:bg-theme-surface active:scale-95';
    }
    if (option === currentProblem?.answer) {
      return 'bg-mint text-white scale-105';
    }
    if (option === selectedOption && feedback === 'incorrect') {
      return 'bg-coral text-white';
    }
    return 'bg-white opacity-50';
  };

  if (!currentProblem) return null;

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header with timer and score */}
      <div className="flex items-center justify-between mb-4">
        <GameTimer
          duration={duration}
          isRunning={isTimerRunning}
          onComplete={handleTimerComplete}
          size="md"
        />
        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <span className="text-sm text-coral font-medium animate-pulse">
              {streak}x streak 🔥
            </span>
          )}
          <ScoreDisplay score={score} icon="zap" variant="success" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-theme-text-muted mb-1">
          <span>Problems: {problemsAnswered}</span>
          <span>
            Accuracy:{' '}
            {problemsAnswered > 0 ? Math.round((correctAnswers / problemsAnswered) * 100) : 100}%
          </span>
        </div>
        <div className="h-2 bg-theme-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-theme-primary to-mint rounded-full transition-all duration-300"
            style={{
              width: `${problemsAnswered > 0 ? (correctAnswers / problemsAnswered) * 100 : 100}%`,
            }}
          />
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Question display */}
        <div
          className={`
          relative bg-gradient-to-br from-theme-primary/10 to-sky/10 
          rounded-3xl p-8 mb-8 transition-all duration-300
          ${feedback === 'correct' ? 'ring-4 ring-mint' : ''}
          ${feedback === 'incorrect' ? 'ring-4 ring-coral' : ''}
        `}
        >
          <span className="text-5xl font-bold text-theme-text">{currentProblem.question}</span>

          {/* Feedback icon */}
          {feedback && (
            <div
              className={`
              absolute -top-3 -right-3 w-10 h-10 rounded-full
              flex items-center justify-center
              ${feedback === 'correct' ? 'bg-mint' : 'bg-coral'}
              animate-in zoom-in duration-200
            `}
            >
              {feedback === 'correct' ? (
                <Check className="w-6 h-6 text-white" />
              ) : (
                <X className="w-6 h-6 text-white" />
              )}
            </div>
          )}
        </div>

        {/* Streak message */}
        {streak >= 3 && feedback === 'correct' && (
          <div className="mb-4 text-coral font-medium animate-bounce">
            {STREAK_MESSAGES[Math.min(streak - 3, STREAK_MESSAGES.length - 1)]}
          </div>
        )}

        {/* Answer options */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {currentProblem.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(option)}
              disabled={feedback !== null}
              className={`
                py-4 rounded-xl font-bold text-2xl
                shadow-card transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary
                ${getOptionStyle(option)}
              `}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-theme-text-muted">
        <p>⚡ Solve as many problems as you can!</p>
        <p className="text-xs mt-1">Bonus points for answer streaks!</p>
      </div>
    </div>
  );
}

export default QuickMathGame;

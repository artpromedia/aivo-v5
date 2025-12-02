'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FocusIndicator } from '@/components/learn/focus-indicator';
import { LessonContent } from '@/components/learn/lesson-content';
import { FocusBreakGame } from '@/components/learn/games/focus-break-game';
import { useFocusMonitor } from '@/lib/focus/focus-monitor';
import type { GameDefinition, GameType } from '@/lib/ai/game-types';
import { buildFallbackGame } from '@/lib/ai/game-templates';
import type { LessonEntity } from '@/lib/types/lesson';

interface LearningSessionProps {
  params: { id: string };
}

const GAME_TYPES: GameType[] = ['PUZZLE', 'MEMORY', 'QUIZ', 'MOVEMENT', 'CREATIVE'];
const SUBJECT_OPTIONS = ['Math', 'Reading', 'Writing', 'Science', 'SEL', 'Speech'] as const;
const DEFAULT_SUBJECT = SUBJECT_OPTIONS[0];

export default function LearningSession({ params }: LearningSessionProps) {
  const { data: session } = useSession();
  const { isDistracted, focusMetrics, shouldShowGame, resumeLearning, registerInteraction } = useFocusMonitor('MEDIUM');

  const [lesson, setLesson] = useState<LessonEntity | null>(null);
  const [gameDefinition, setGameDefinition] = useState<GameDefinition | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isFetchingGame, setIsFetchingGame] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>(DEFAULT_SUBJECT);
  const [isLessonLoading, setIsLessonLoading] = useState(true);

  const gameCycleRef = useRef(0);

  const selectGameType = useCallback((): GameType => {
    const type = GAME_TYPES[gameCycleRef.current % GAME_TYPES.length];
    gameCycleRef.current += 1;
    return type;
  }, []);

  const fetchLesson = useCallback(
    async (subject: string) => {
      setIsLessonLoading(true);
      setLesson(null);
      setLessonError(null);
      try {
        const response = await fetch(`/api/learn/lessons/${params.id}?subject=${encodeURIComponent(subject)}`, {
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Failed to personalize lesson');
        }

        const payload = (await response.json()) as LessonEntity;
        setLesson(payload);
      } catch (error) {
        console.warn('Falling back to local lesson template', error);
        setLesson(buildMockLesson(params.id, subject));
        setLessonError(`Live personalization is warming up—showing a steady ${subject.toLowerCase()} lesson for now.`);
      } finally {
        setIsLessonLoading(false);
      }
    },
    [params.id]
  );

  useEffect(() => {
    void fetchLesson(selectedSubject);
  }, [fetchLesson, selectedSubject]);

  const handleSubjectChange = useCallback(
    (subject: string) => {
      if (subject === selectedSubject) {
        return;
      }
      setSelectedSubject(subject);
    },
    [selectedSubject]
  );

  const handleRefreshLesson = useCallback(() => {
    void fetchLesson(selectedSubject);
  }, [fetchLesson, selectedSubject]);

  const generateBreakGame = useCallback(async () => {
    if (isFetchingGame) return;
    setIsPaused(true);
    setIsFetchingGame(true);
    const gameType = selectGameType();

    const payload = {
      learnerId: session?.user?.id ?? params.id,
      subject: lesson?.subject ?? selectedSubject ?? DEFAULT_SUBJECT,
      difficulty: Math.max(1, Math.min(10, Math.round((focusMetrics?.focusScore ?? 50) / 10))),
      gameType,
      duration: 2,
      educationalGoal: lesson?.currentTopic ?? 'refocus'
    };

    try {
      const response = await fetch('/api/focus/generate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Unable to build game');
      }

      const definition = (await response.json()) as GameDefinition;
      setGameDefinition(definition);
    } catch (error) {
      console.warn('Falling back to local game template', error);
      setGameDefinition(
        buildFallbackGame({
          learnerId: payload.learnerId,
          subject: payload.subject,
          difficulty: payload.difficulty,
          gameType,
          duration: payload.duration,
          educationalGoal: payload.educationalGoal
        })
      );
    } finally {
      setIsFetchingGame(false);
    }
  }, [focusMetrics?.focusScore, isFetchingGame, selectGameType, lesson?.subject, lesson?.currentTopic, params.id, session?.user?.id, selectedSubject]);

  useEffect(() => {
    if (shouldShowGame && !gameDefinition) {
      void generateBreakGame();
    }
  }, [generateBreakGame, gameDefinition, shouldShowGame]);

  const handleGameComplete = useCallback(async () => {
    if (gameDefinition) {
      try {
        await fetch('/api/focus/game-completed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            learnerId: session?.user?.id ?? params.id,
            gameType: gameDefinition.gameType,
            duration: gameDefinition.duration,
            returnedToLearning: true
          })
        });
      } catch (error) {
        console.warn('Unable to log game completion', error);
      }
    }

    setGameDefinition(null);
    setIsPaused(false);
    resumeLearning();
  }, [gameDefinition, params.id, resumeLearning, session?.user?.id]);

  const handleInteraction = useCallback(() => {
    registerInteraction();
  }, [registerInteraction]);

  const focusScore = focusMetrics?.focusScore ?? 100;

  if (gameDefinition) {
    return (
      <div className="min-h-screen">
        <div className="fixed top-4 right-4 z-20 rounded-2xl bg-white/90 p-4 shadow-lg">
          <p className="text-sm font-semibold text-slate-800">Time for a brain break!</p>
          <p className="text-xs text-slate-500">Complete this game to hop back into your lesson.</p>
        </div>
        <FocusBreakGame definition={gameDefinition} onComplete={handleGameComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <FocusIndicator score={focusScore} isPaused={isPaused} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl transition ${isPaused ? 'opacity-60' : 'opacity-100'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Session cadence</p>
              <h1 className="text-3xl font-semibold text-slate-900">Lesson #{params.id}</h1>
              <p className="text-sm text-slate-500">Smooth transitions between instruction and regenerative play.</p>
              {isDistracted && (
                <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Focus break triggered
                </span>
              )}
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>{focusMetrics?.sessionDuration ? Math.round(focusMetrics.sessionDuration / 60) : 0} min active</p>
              <p>{focusMetrics?.distractionCount ?? 0} distraction patterns</p>
            </div>
          </div>
        </motion.div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Choose what to learn</p>
              <p className="text-sm text-slate-500">Pick a subject to refresh the personalized lesson.</p>
            </div>
            <button
              type="button"
              onClick={handleRefreshLesson}
              disabled={isLessonLoading}
              className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition ${isLessonLoading ? 'bg-slate-300' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
              {isLessonLoading ? 'Refreshing…' : 'Refresh lesson'}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {SUBJECT_OPTIONS.map((option) => {
              const isActive = option === selectedSubject;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={isLessonLoading && isActive}
                  onClick={() => handleSubjectChange(option)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  } ${isLessonLoading && isActive ? 'opacity-60' : ''}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {lessonError && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
            {lessonError}
          </div>
        )}

        <LessonContent lesson={lesson} isPaused={isPaused} onInteraction={handleInteraction} />
      </div>

      {isPaused && !gameDefinition && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40">
          <div className="rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900">Let’s load a personalized brain break</h3>
            <p className="mt-2 text-slate-500">We noticed distraction patterns. We’ll switch into a quick game and then resume your lesson.</p>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-3 w-3 animate-ping rounded-full bg-theme-primary" />
              <span className="text-sm text-theme-primary">Curating your game...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildMockLesson(id: string, subject: string = DEFAULT_SUBJECT): LessonEntity {
  const topic = subject === 'Math' ? 'Friendly Fractions' : `${subject} confidence boost`;
  return {
    id,
    subject,
    currentTopic: topic,
    summary: `We are keeping ${subject.toLowerCase()} calm and concrete with sensory-friendly anchors and real-life connections.`,
    segments: [
      {
        id: `${id}-intro`,
        title: 'Calm warm-up',
        content: `Take three steady breaths while thinking about where ${subject.toLowerCase()} shows up in your day.`,
        status: 'IN_PROGRESS'
      },
      {
        id: `${id}-visual`,
        title: 'Visual model building',
        content: `Sketch or drag shapes that match today’s ${subject.toLowerCase()} concept to keep it tactile.`,
        status: 'READY'
      },
      {
        id: `${id}-story`,
        title: 'Story remix',
        content: `Retell a calm real-life moment using today’s ${subject.toLowerCase()} vocabulary and drawings.`,
        status: 'READY'
      },
      {
        id: `${id}-reflect`,
        title: 'Reflection bubble',
        content: `Share one strategy that made ${subject.toLowerCase()} calmer today.`,
        status: 'COMPLETE'
      }
    ]
  };
}

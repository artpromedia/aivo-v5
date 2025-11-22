'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  AdaptiveCurriculumEngine,
  type LessonPlan,
  type LessonActivity,
  type PerformanceMetrics,
  type ActivityResult,
  type Subject,
  type Skill,
  type Activity
} from '@/lib/curriculum/adaptive-engine';
import type { LearnerProfile } from '@/lib/types/models';
import { ContentRenderer, PerformanceIndicator } from '@/components/learn/ContentRenderer';

const SUBJECT_OPTIONS: Subject[] = ['READING', 'MATH', 'SCIENCE', 'SEL', 'SPEECH'];

export default function AdaptiveLessonView() {
  const { data: session, status } = useSession();
  const engineRef = useRef<AdaptiveCurriculumEngine>();
  if (!engineRef.current) {
    engineRef.current = new AdaptiveCurriculumEngine();
  }

  const [subject, setSubject] = useState<Subject>('READING');
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [activities, setActivities] = useState<LessonActivity[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    accuracy: 0.75,
    timePerQuestion: 60_000,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    currentLevel: 4,
    sampleSize: 0
  });
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  const [scaffolds, setScaffolds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);

  const currentActivity = activities[currentActivityIndex];

  const loadTodaysLesson = useCallback(async () => {
    if (status !== 'authenticated') return;
    setIsLoading(true);
    setLessonComplete(false);
    setCompletedActivities([]);
    setScaffolds([]);
    try {
      const engine = engineRef.current!;
      const planResponse = await engine.generateLessonPlan(session?.user?.id ?? 'anonymous', subject, 7);
      setPlan(planResponse);
      const todayIso = new Date().toISOString().slice(0, 10);
      const todayBlock = planResponse.dailySchedule.find((entry) => entry.date.slice(0, 10) === todayIso) ?? planResponse.dailySchedule[0];
      setActivities(todayBlock?.lessons ?? []);
      setCurrentActivityIndex(0);
      setPerformance((prev) => ({
        ...prev,
        accuracy: 0.75,
        timePerQuestion: 60_000,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        currentLevel:
          todayBlock?.lessons?.[0]?.difficulty ?? planResponse.domainLevels[planResponse.subject] ?? planResponse.learnerProfile.actualLevel ?? prev.currentLevel,
        sampleSize: 0
      }));
    } catch (error) {
      setToast((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status, subject]);

  useEffect(() => {
    if (status === 'authenticated') {
      void loadTodaysLesson();
    }
  }, [loadTodaysLesson, status]);

  const learnerProfile = plan?.learnerProfile ?? (null as LearnerProfile | null);

  const handleActivityComplete = useCallback(
    async (result: ActivityResult) => {
      if (!plan || !currentActivity || !learnerProfile) return;

      const updatedPerformance = rollupPerformance(performance, result, currentActivity.difficulty);
      setPerformance(updatedPerformance);
      setCompletedActivities((prev) => [...prev, result.activityId]);

      try {
        const engine = engineRef.current!;
        const adjustment = await engine.adjustDifficulty(plan.id, updatedPerformance);
        setScaffolds(adjustment.scaffolding ?? []);

        if (adjustment.newLevel) {
          setPerformance((prev) => ({ ...prev, currentLevel: adjustment.newLevel ?? prev.currentLevel }));
        }

        if (adjustment.action === 'INCREASE' || adjustment.action === 'DECREASE') {
          const skill: Skill = {
            id: currentActivity.skillId,
            name: currentActivity.skillName,
            domain: currentActivity.domain,
            description: currentActivity.description,
            targetGrade: currentActivity.difficulty
          };
          const nextActivity = await engine.selectNextActivity(skill, learnerProfile, [...completedActivities, result.activityId]);
          const enriched = hydrateActivity(nextActivity, skill, activities.length + 1);
          setActivities((prev) => {
            const next = [...prev];
            next.splice(currentActivityIndex + 1, 0, enriched);
            return next;
          });
          setCurrentActivityIndex((prev) => prev + 1);
          return;
        }

        advanceToNextActivity(() => activities.length, setCurrentActivityIndex, setLessonComplete);
      } catch (error) {
        setToast((error as Error).message);
        advanceToNextActivity(() => activities.length, setCurrentActivityIndex, setLessonComplete);
      }
    },
    [activities.length, completedActivities, currentActivity, currentActivityIndex, learnerProfile, performance, plan]
  );

  const subjectChips = useMemo(
    () =>
      SUBJECT_OPTIONS.map((option) => {
        const isActive = option === subject;
        return (
          <button
            key={option}
            type="button"
            disabled={isLoading && isActive}
            onClick={() => {
              if (option !== subject) {
                setSubject(option);
              }
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive ? 'bg-purple-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50'
            } ${isLoading && isActive ? 'opacity-60' : ''}`}
          >
            {option}
          </button>
        );
      }),
    [isLoading, subject]
  );

  if (status === 'loading') {
    return <ScreenMessage>Preparing adaptive lesson…</ScreenMessage>;
  }

  if (!session?.user) {
    return <ScreenMessage>Please sign in to access adaptive lessons.</ScreenMessage>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white/90 p-6 shadow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-purple-500">Adaptive curriculum engine</p>
              <h1 className="text-4xl font-semibold text-slate-900">Dynamic lesson flow</h1>
              <p className="text-slate-600">Realtime adjustments keep you in the zone of proximal development.</p>
            </div>
            <button
              type="button"
              onClick={() => loadTodaysLesson()}
              disabled={isLoading}
              className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition ${isLoading ? 'bg-slate-300' : 'bg-slate-900 hover:bg-black'}`}
            >
              {isLoading ? 'Loading…' : 'Refresh plan'}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">{subjectChips}</div>
        </motion.header>

        <PerformanceIndicator metrics={performance} />

        {scaffolds.length > 0 && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
            <p className="font-semibold">Scaffolding boost</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {scaffolds.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {toast && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800">
            {toast}
            <button type="button" className="ml-3 text-xs font-semibold underline" onClick={() => setToast(null)}>
              Dismiss
            </button>
          </div>
        )}

        {lessonComplete && <CompletionCelebration subject={subject} onReset={() => void loadTodaysLesson()} />}

        {!lessonComplete && currentActivity && (
          <ContentRenderer activity={currentActivity} onComplete={handleActivityComplete} adaptiveMode />
        )}

        {!lessonComplete && !currentActivity && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">
            {isLoading ? 'Personalizing lesson pieces…' : 'No activities scheduled for today. Refresh to regenerate.'}
          </div>
        )}
      </div>
    </div>
  );
}

function ScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950/80 p-6 text-slate-50">
      <div className="rounded-3xl bg-slate-900/70 p-10 text-center text-lg shadow-xl">{children}</div>
    </div>
  );
}

function CompletionCelebration({ subject, onReset }: { subject: Subject; onReset: () => void }) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 text-center shadow">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Daily wrap</p>
      <h2 className="mt-2 text-3xl font-semibold text-emerald-900">{subject} session complete</h2>
      <p className="mt-2 text-emerald-800">Great pacing. Take a sensory break or jump into another subject.</p>
      <button type="button" onClick={onReset} className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">
        Regenerate plan
      </button>
    </motion.div>
  );
}

function hydrateActivity(activity: Activity, skill: Skill, sequence: number): LessonActivity {
  return {
    ...activity,
    skillId: skill.id,
    skillName: skill.name,
    domain: skill.domain,
    sequence,
    scaffolds: activity.scaffolds
  };
}

function advanceToNextActivity(
  getTotalActivities: () => number,
  setCurrentActivityIndex: React.Dispatch<React.SetStateAction<number>>,
  setLessonComplete: (complete: boolean) => void
) {
  setCurrentActivityIndex((prev) => {
    const nextIndex = prev + 1;
    if (nextIndex >= getTotalActivities()) {
      setLessonComplete(true);
      return prev;
    }
    return nextIndex;
  });
}

function rollupPerformance(previous: PerformanceMetrics, result: ActivityResult, level: number): PerformanceMetrics {
  const sampleSize = (previous.sampleSize ?? 0) + 1;
  const accuracy = ((previous.accuracy * (sampleSize - 1)) + result.accuracy) / sampleSize;
  const timePerQuestion = ((previous.timePerQuestion * (sampleSize - 1)) + result.timePerQuestion) / sampleSize;
  const consecutiveCorrect = result.accuracy >= 0.75 ? previous.consecutiveCorrect + 1 : 0;
  const consecutiveIncorrect = result.accuracy < 0.5 ? previous.consecutiveIncorrect + 1 : 0;

  return {
    accuracy,
    timePerQuestion,
    consecutiveCorrect,
    consecutiveIncorrect,
    currentLevel: previous.currentLevel ?? level,
    sampleSize
  };
}

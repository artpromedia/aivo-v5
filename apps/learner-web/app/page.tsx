'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AivoApiClient } from '@aivo/api-client';
import type { SubjectCode, SubjectLevel } from '@aivo/types';
import { EmotionCheckInModal } from '../components/EmotionCheckInModal';
import { BreakReminderBanner } from '../components/BreakReminderBanner';
import { useEmotionCheckIn } from '../hooks/useEmotionCheckIn';
import { useBreakReminder } from '../hooks/useBreakReminder';
import {
  ProgressCard,
  QuickStatsRow,
  QuickActions,
  SubjectCards,
  StartSessionCard,
  sampleSubjects,
} from '../components/home';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
const client = new AivoApiClient(API_BASE_URL);

type LearnerOverview = {
  displayName: string;
  currentGrade: number;
  focusSubject?: SubjectLevel;
};

function gradeLabel(grade?: number) {
  if (!grade) return 'grade';
  const suffix =
    grade % 10 === 1 && grade !== 11
      ? 'st'
      : grade % 10 === 2 && grade !== 12
        ? 'nd'
        : grade % 10 === 3 && grade !== 13
          ? 'rd'
          : 'th';
  return `${grade}${suffix} grade`;
}

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Math',
  ela: 'English Language Arts',
  reading: 'Reading',
  writing: 'Writing',
  science: 'Science',
  social_studies: 'Social Studies',
  sel: 'Social-Emotional Learning',
  speech: 'Speech',
  other: 'Learning',
};

function subjectLabel(subject?: SubjectCode) {
  if (!subject) return 'learning';
  return SUBJECT_LABELS[subject] ?? subject.toUpperCase();
}

type LearnerHomeProps = {
  overview: LearnerOverview | null;
  loading: boolean;
  error: string | null;
  showBreakReminder: boolean;
  onTakeBreak: () => void;
  onDismissBreakReminder: () => void;
};

function LearnerHome({
  overview,
  loading,
  error,
  showBreakReminder,
  onTakeBreak,
  onDismissBreakReminder,
}: LearnerHomeProps) {
  const badgeText = useMemo(() => {
    if (overview?.focusSubject) {
      const assessed = gradeLabel(overview.focusSubject.assessedGradeLevel);
      return `${gradeLabel(overview.currentGrade)} • ${subjectLabel(overview.focusSubject.subject)} at ${assessed} level`;
    }
    if (overview) {
      return gradeLabel(overview.currentGrade);
    }
    return 'Preparing your learner profile';
  }, [overview]);

  const firstName = overview?.displayName?.split(' ')[0] ?? 'Friend';
  const focusSubjectName = overview?.focusSubject
    ? subjectLabel(overview.focusSubject.subject)
    : undefined;

  // Mock data for visualization (would be replaced with real API data)
  const weekProgress = 67;
  const streakDays = 5;
  const totalScore = 1240;
  const lessonsCompleted = 12;

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-slate-50 pb-24">
      {/* Break Reminder Banner */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <BreakReminderBanner
          isVisible={showBreakReminder}
          onTakeBreak={onTakeBreak}
          onDismiss={onDismissBreakReminder}
        />
      </div>

      {/* Header Section */}
      <header className="bg-gradient-to-br from-[var(--color-primary)] via-violet-600 to-purple-700 pt-8 pb-16 px-4 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 -left-10 w-32 h-32 bg-white/10 rounded-full" />

        <div className="max-w-xl mx-auto relative z-10">
          {/* Avatar and greeting */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
              <span className="text-white text-xl font-bold">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white/80 text-sm">Welcome back,</p>
              <h1 className="text-2xl font-bold text-white">
                {loading ? 'Loading...' : `${firstName}! 👋`}
              </h1>
            </div>
            {/* Badge */}
            <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="text-white text-xs font-medium">{badgeText}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Overlapping Cards */}
      <div className="max-w-xl mx-auto px-4 -mt-10 space-y-6">
        {/* Progress Card */}
        <ProgressCard percentage={weekProgress} loading={loading} streakDays={streakDays} />

        {/* Quick Stats Row */}
        <QuickStatsRow
          score={totalScore}
          lessonsCompleted={lessonsCompleted}
          streak={streakDays}
          loading={loading}
        />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-xl">😅</span>
            <div>
              <p className="text-sm font-medium text-red-800">Oops! Something went wrong</p>
              <p className="text-xs text-red-600">
                Don&apos;t worry! Just refresh the page or check your connection.
              </p>
            </div>
          </div>
        )}

        {/* Start Session Card */}
        <StartSessionCard
          ready={!loading && !error}
          focusSubject={focusSubjectName}
          estimatedMinutes={15}
          activitiesCount={3}
          hasStreak={streakDays >= 3}
          loading={loading}
        />

        {/* Subject Cards */}
        <SubjectCards subjects={sampleSubjects} loading={loading} layout="scroll" />

        {/* Quick Actions Grid */}
        <QuickActions columns={2} />

        {/* Encouragement Footer */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Take your time. You&apos;ve got this! 💪</p>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  const router = useRouter();
  const [overview, setOverview] = useState<LearnerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmotionModal, setShowEmotionModal] = useState(false);

  // Emotion check-in hook
  const { shouldShowCheckIn, logEmotionCheckIn, skipCheckIn } = useEmotionCheckIn({
    context: 'home_launch',
    isInSession: false,
  });

  // Break reminder hook
  const { shouldShowReminder, takeBreak, dismissReminder } = useBreakReminder({
    breakIntervalMinutes: 20,
    defaultSnoozeDurationMinutes: 10,
    onBreakTaken: () => {
      console.log('[HomePage] Break taken');
    },
    onReminderDismissed: () => {
      console.log('[HomePage] Break reminder dismissed');
    },
  });

  // Show emotion check-in modal after page loads (if needed)
  useEffect(() => {
    if (!loading && !error && shouldShowCheckIn) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setShowEmotionModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, error, shouldShowCheckIn]);

  const handleEmotionComplete = useCallback(
    (emotion: Parameters<typeof logEmotionCheckIn>[0], intensity: number) => {
      logEmotionCheckIn(emotion, intensity, 'home_launch');
      setShowEmotionModal(false);
    },
    [logEmotionCheckIn],
  );

  const handleEmotionSkip = useCallback(() => {
    skipCheckIn();
    setShowEmotionModal(false);
  }, [skipCheckIn]);

  const handleTakeBreak = useCallback(() => {
    takeBreak();
  }, [takeBreak]);

  const handleDismissBreakReminder = useCallback(() => {
    dismissReminder();
  }, [dismissReminder]);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      setLoading(true);
      setError(null);
      try {
        const meRes = await client.me();
        if (!meRes.learner) {
          router.replace('/baseline');
          return;
        }
        const learnerRes = await client.getLearner(meRes.learner.id);
        if (!learnerRes.brainProfile) {
          router.replace('/baseline');
          return;
        }

        if (!active) return;

        const preferredSubject = meRes.learner.subjects?.[0] as SubjectCode | undefined;
        const subjectLevel =
          learnerRes.brainProfile.subjectLevels.find(
            (level) => level.subject === preferredSubject,
          ) ?? learnerRes.brainProfile.subjectLevels[0];

        setOverview({
          displayName: meRes.learner.displayName,
          currentGrade: learnerRes.learner.currentGrade,
          focusSubject: subjectLevel,
        });
      } catch (e) {
        if (!active) return;
        setError((e as Error).message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <>
      <LearnerHome
        overview={overview}
        loading={loading}
        error={error}
        showBreakReminder={shouldShowReminder}
        onTakeBreak={handleTakeBreak}
        onDismissBreakReminder={handleDismissBreakReminder}
      />

      {/* Emotion Check-In Modal */}
      <EmotionCheckInModal
        isOpen={showEmotionModal}
        onComplete={handleEmotionComplete}
        onSkip={handleEmotionSkip}
        onClose={handleEmotionSkip}
      />
    </>
  );
}

'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Save, AlertCircle } from 'lucide-react';
import type { IEPGoal, IEPMeasurementContext, IEPDataPoint } from '../../../../types/iep';
import {
  CATEGORY_CONFIG,
  CONTEXT_CONFIG,
  ALL_CONTEXTS,
  formatDate,
  getLatestDataPoint,
  calculateProgress,
} from '../../../../types/iep';
import { IEPEvidenceUpload } from '../../../../components/iep/IEPEvidenceUpload';
import { useIEPDataEntryForm } from '../../../../components/iep/useIEPDataEntryForm';
import type { EvidenceFile } from '../../../../components/iep/IEPEvidenceUpload';

// ============================================================================
// Constants
// ============================================================================

const MAX_NOTES_LENGTH = 500;

// ============================================================================
// Mock Data (will be replaced with API calls)
// ============================================================================

function generateMockGoal(goalId: string): IEPGoal {
  const now = new Date();

  return {
    id: goalId,
    learnerId: 'demo-learner',
    name: 'Reading Comprehension',
    description:
      'Student will answer inferential questions about grade-level text with 80% accuracy.',
    category: 'academic',
    subject: 'English Language Arts',
    status: 'on_track',
    currentValue: 65,
    targetValue: 80,
    unit: '% accuracy',
    startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    targetDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    reviewDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    dataPoints: [
      {
        id: 'dp1',
        goalId,
        value: 45,
        measurementDate: new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000).toISOString(),
        context: 'classroom',
        recordedBy: 'Ms. Johnson',
      },
      {
        id: 'dp2',
        goalId,
        value: 52,
        measurementDate: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString(),
        context: 'assessment',
        recordedBy: 'Dr. Smith',
      },
      {
        id: 'dp3',
        goalId,
        value: 58,
        measurementDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        context: 'therapy',
        recordedBy: 'Mrs. Davis',
      },
      {
        id: 'dp4',
        goalId,
        value: 65,
        measurementDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        context: 'classroom',
        recordedBy: 'Ms. Johnson',
      },
    ],
    notes: [],
    createdAt: new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// ============================================================================
// Goal Summary Card
// ============================================================================

interface GoalSummaryCardProps {
  goal: IEPGoal;
}

function GoalSummaryCard({ goal }: GoalSummaryCardProps) {
  const category = CATEGORY_CONFIG[goal.category];
  const latestDataPoint = getLatestDataPoint(goal);
  const progress = calculateProgress(goal);

  return (
    <div className={`rounded-2xl p-4 border-2 ${category.bgColor} ${category.borderColor}`}>
      <div className="flex items-center gap-3">
        {/* Category emoji */}
        <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <span className="text-3xl">{category.emoji}</span>
        </div>

        {/* Goal info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg">{goal.name}</h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 mt-1">
            <span>
              Current: <strong>{goal.currentValue.toFixed(1)}</strong>
            </span>
            <span>→</span>
            <span>
              Target: <strong>{goal.targetValue.toFixed(1)}</strong> {goal.unit}
            </span>
          </div>
          {latestDataPoint && (
            <p className="text-xs text-gray-500 mt-1">
              Last: {latestDataPoint.value.toFixed(1)} {goal.unit} on{' '}
              {formatDate(latestDataPoint.measurementDate)}
            </p>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex-shrink-0 text-center">
          <div className="text-2xl font-bold text-violet-600">{progress.toFixed(0)}%</div>
          <div className="text-xs text-gray-500">progress</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Value Input Section
// ============================================================================

interface ValueInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  unit: string;
  recentValues: number[];
  error?: string;
  disabled?: boolean;
}

function ValueInput({
  value,
  onChange,
  onBlur,
  unit,
  recentValues,
  error,
  disabled,
}: ValueInputProps) {
  const inputId = 'value-input';
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
      <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700">
        Measurement Value <span className="text-red-500">*</span>
      </label>

      {/* Input with unit */}
      <div
        className={`flex overflow-hidden rounded-xl border-2 transition-colors ${
          error
            ? 'border-red-300 focus-within:border-red-500'
            : 'border-gray-200 focus-within:border-violet-500'
        }`}
      >
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="0.0"
          className="flex-1 px-4 py-5 text-3xl font-bold text-center text-gray-900 outline-none disabled:bg-gray-50 disabled:text-gray-400"
        />
        <div className="flex items-center px-5 bg-violet-50 border-l border-gray-200">
          <span className="text-sm font-semibold text-violet-600">{unit}</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick value buttons */}
      {recentValues.length > 0 && (
        <div className="pt-2">
          <p className="text-xs text-gray-500 mb-2">Quick select recent values:</p>
          <div className="flex flex-wrap gap-2">
            {recentValues.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v.toString())}
                disabled={disabled}
                className="px-4 py-2 text-sm font-medium bg-gray-100 border border-gray-200 rounded-full hover:bg-violet-100 hover:border-violet-300 hover:text-violet-700 transition-colors disabled:opacity-50"
              >
                {v.toFixed(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Date Picker Section
// ============================================================================

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
}

function DatePickerSection({ value, onChange, onBlur, error, disabled }: DatePickerProps) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = value === today;
  const inputId = 'date-input';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
      <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700">
        Measurement Date <span className="text-red-500">*</span>
      </label>

      <div
        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
          error ? 'border-red-300' : 'border-gray-200 focus-within:border-violet-500'
        }`}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-violet-100 rounded-xl">
          <Calendar className="w-6 h-6 text-violet-600" />
        </div>

        <div className="flex-1">
          <input
            id={inputId}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            max={today}
            disabled={disabled}
            className="w-full text-lg font-medium text-gray-900 outline-none disabled:bg-transparent disabled:text-gray-400"
          />
          {isToday && <span className="text-xs text-emerald-600 font-medium">Today</span>}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Context Selection Section
// ============================================================================

interface ContextSelectionProps {
  value: IEPMeasurementContext | null;
  onChange: (value: IEPMeasurementContext) => void;
  error?: string;
  disabled?: boolean;
}

function ContextSelection({ value, onChange, error, disabled }: ContextSelectionProps) {
  return (
    <div
      className="bg-white rounded-2xl shadow-lg p-5 space-y-3"
      role="group"
      aria-labelledby="context-label"
    >
      <div>
        <p id="context-label" className="block text-sm font-semibold text-gray-700">
          Context <span className="text-red-500">*</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">Where was this measurement taken?</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ALL_CONTEXTS.map((context) => {
          const config = CONTEXT_CONFIG[context];
          const isSelected = value === context;

          return (
            <button
              key={context}
              type="button"
              onClick={() => onChange(context)}
              disabled={disabled}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-xl">{config.icon}</span>
              <span className="text-sm font-medium">{config.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Notes Input Section
// ============================================================================

interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function NotesInput({ value, onChange, disabled }: NotesInputProps) {
  const charCount = value.length;
  const isNearLimit = charCount > MAX_NOTES_LENGTH * 0.8;
  const textareaId = 'notes-input';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
      <div>
        <label htmlFor={textareaId} className="block text-sm font-semibold text-gray-700">
          Notes
          <span className="font-normal text-gray-400 ml-1">(optional)</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">Add any observations about this measurement</p>
      </div>

      <div className="relative">
        <textarea
          id={textareaId}
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= MAX_NOTES_LENGTH) {
              onChange(e.target.value);
            }
          }}
          disabled={disabled}
          placeholder='e.g., "Used visual supports", "After break time", "Student was tired"'
          rows={4}
          className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none resize-none transition-colors focus:border-violet-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <div
          className={`absolute bottom-3 right-4 text-xs ${
            isNearLimit ? 'text-amber-600' : 'text-gray-400'
          }`}
        >
          {charCount}/{MAX_NOTES_LENGTH}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Evidence Section Wrapper
// ============================================================================

interface EvidenceSectionProps {
  value: EvidenceFile | null;
  onChange: (value: EvidenceFile | null) => void;
  disabled?: boolean;
}

function EvidenceSection({ value, onChange, disabled }: EvidenceSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5">
      <IEPEvidenceUpload value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ============================================================================
// Main Page Content
// ============================================================================

function AddDataContent() {
  const router = useRouter();
  const params = useParams();
  const goalId = params.goalId as string;

  // State
  const [goal, setGoal] = useState<IEPGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // Load goal
  useEffect(() => {
    const loadGoal = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 300));
        const mockGoal = generateMockGoal(goalId);
        setGoal(mockGoal);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadGoal();
  }, [goalId]);

  // Handle success
  const handleSuccess = useCallback(
    (_dataPoint: IEPDataPoint) => {
      setSuccessToast(true);
      setTimeout(() => {
        router.push(`/iep/${goalId}`);
      }, 1500);
    },
    [router, goalId],
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push(`/iep/${goalId}`);
  }, [router, goalId]);

  if (loading) {
    return <AddDataSkeleton />;
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{error || 'Goal not found'}</h2>
          <Link href="/iep" className="text-violet-600 hover:text-violet-700 font-medium">
            ← Back to IEP Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AddDataForm
      goal={goal}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      showSuccessToast={successToast}
    />
  );
}

// ============================================================================
// Form Component (separated to use hook after goal is loaded)
// ============================================================================

interface AddDataFormProps {
  goal: IEPGoal;
  onSuccess: (dataPoint: IEPDataPoint) => void;
  onCancel: () => void;
  showSuccessToast: boolean;
}

function AddDataForm({ goal, onSuccess, onCancel, showSuccessToast }: AddDataFormProps) {
  const form = useIEPDataEntryForm({
    goal,
    onSuccess,
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await form.submit();
    },
    [form],
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 pb-28">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              disabled={form.isSubmitting}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Add Data Point</h1>
              <p className="text-sm text-gray-500">Record a new measurement</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Goal Summary */}
        <GoalSummaryCard goal={goal} />

        {/* Value Input */}
        <ValueInput
          value={form.data.value}
          onChange={form.setValue}
          onBlur={() => form.touchField('value')}
          unit={goal.unit}
          recentValues={form.recentValues}
          error={form.getFieldError('value')}
          disabled={form.isSubmitting}
        />

        {/* Date Picker */}
        <DatePickerSection
          value={form.data.date}
          onChange={form.setDate}
          onBlur={() => form.touchField('date')}
          error={form.getFieldError('date')}
          disabled={form.isSubmitting}
        />

        {/* Context Selection */}
        <ContextSelection
          value={form.data.context}
          onChange={form.setContext}
          error={form.getFieldError('context')}
          disabled={form.isSubmitting}
        />

        {/* Notes */}
        <NotesInput value={form.data.notes} onChange={form.setNotes} disabled={form.isSubmitting} />

        {/* Evidence Upload */}
        <EvidenceSection
          value={form.data.evidence}
          onChange={form.setEvidence}
          disabled={form.isSubmitting}
        />
      </form>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-20">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={form.isSubmitting}
            className="flex-1 py-3.5 px-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={form.isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-70"
          >
            {form.isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Data Point</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <span className="text-xl">✓</span>
            <span className="font-medium">Data point saved!</span>
          </div>
        </div>
      )}
    </main>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function AddDataSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 pb-28 animate-pulse">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 bg-gray-100 rounded" />
              <div className="h-4 w-40 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Goal summary */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 bg-gray-100 rounded" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>
            <div className="w-16 h-10 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Value input */}
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
          <div className="h-5 w-32 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>

        {/* Date picker */}
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
          <div className="h-5 w-36 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded-xl" />
        </div>

        {/* Context */}
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
          <div className="h-5 w-20 bg-gray-100 rounded" />
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
          <div className="h-5 w-16 bg-gray-100 rounded" />
          <div className="h-28 bg-gray-100 rounded-xl" />
        </div>

        {/* Evidence */}
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
          <div className="h-5 w-20 bg-gray-100 rounded" />
          <div className="h-28 bg-gray-100 rounded-xl border-2 border-dashed border-gray-200" />
        </div>
      </div>
    </main>
  );
}

// ============================================================================
// Page Export with Suspense
// ============================================================================

export default function AddDataPage() {
  return (
    <Suspense fallback={<AddDataSkeleton />}>
      <AddDataContent />
    </Suspense>
  );
}

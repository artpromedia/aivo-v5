'use client';

import { useCallback, useEffect } from 'react';
import { X, Calendar, Save, AlertCircle } from 'lucide-react';
import type { IEPGoal, IEPMeasurementContext, IEPDataPoint } from '../../types/iep';
import {
  CATEGORY_CONFIG,
  CONTEXT_CONFIG,
  ALL_CONTEXTS,
  formatDate,
  getLatestDataPoint,
  calculateProgress,
} from '../../types/iep';
import { useIEPDataEntryForm } from './useIEPDataEntryForm';
import { IEPEvidenceUpload } from './IEPEvidenceUpload';

// ============================================================================
// Types
// ============================================================================

interface IEPDataEntryModalProps {
  goal: IEPGoal;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (dataPoint: IEPDataPoint) => void;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_NOTES_LENGTH = 500;

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
    <div className={`rounded-xl p-4 border ${category.bgColor} ${category.borderColor}`}>
      <div className="flex items-center gap-3">
        {/* Category emoji */}
        <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <span className="text-2xl">{category.emoji}</span>
        </div>

        {/* Goal info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{goal.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Current: {goal.currentValue.toFixed(1)} {goal.unit}
            </span>
            <span>•</span>
            <span>
              Target: {goal.targetValue.toFixed(1)} {goal.unit}
            </span>
          </div>
          {latestDataPoint && (
            <p className="text-xs text-gray-500 mt-1">
              Last recorded: {formatDate(latestDataPoint.measurementDate)}
            </p>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex-shrink-0 text-right">
          <div className="text-lg font-bold text-violet-600">{progress.toFixed(0)}%</div>
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
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700">
        Value <span className="text-red-500">*</span>
      </label>

      {/* Input with unit */}
      <div
        className={`flex overflow-hidden bg-white rounded-xl shadow-sm border-2 transition-colors ${
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
          className="flex-1 px-4 py-4 text-2xl font-bold text-center text-gray-900 outline-none disabled:bg-gray-50 disabled:text-gray-400"
        />
        <div className="flex items-center px-4 bg-violet-50">
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
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs text-gray-500">Quick select:</span>
          {recentValues.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v.toString())}
              disabled={disabled}
              className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-full hover:bg-violet-50 hover:border-violet-300 transition-colors disabled:opacity-50"
            >
              {v.toFixed(1)}
            </button>
          ))}
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

function DatePicker({ value, onChange, onBlur, error, disabled }: DatePickerProps) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = value === today;
  const inputId = 'date-input';

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700">
        Date <span className="text-red-500">*</span>
      </label>

      <div
        className={`flex items-center gap-3 p-4 bg-white rounded-xl border-2 transition-colors ${
          error ? 'border-red-300' : 'border-gray-200 focus-within:border-violet-500'
        }`}
      >
        <div className="flex items-center justify-center w-11 h-11 bg-violet-100 rounded-xl">
          <Calendar className="w-5 h-5 text-violet-600" />
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
            className="w-full text-base font-medium text-gray-900 outline-none disabled:bg-transparent disabled:text-gray-400"
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
    <div className="space-y-2" role="group" aria-labelledby="context-label">
      <p id="context-label" className="block text-sm font-semibold text-gray-700">
        Context <span className="text-red-500">*</span>
      </p>
      <p className="text-xs text-gray-500">Where was this measurement taken?</p>

      <div className="flex flex-wrap gap-2">
        {ALL_CONTEXTS.map((context) => {
          const config = CONTEXT_CONFIG[context];
          const isSelected = value === context;

          return (
            <button
              key={context}
              type="button"
              onClick={() => onChange(context)}
              disabled={disabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all ${
                isSelected
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>{config.icon}</span>
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
    <div className="space-y-2">
      <label htmlFor={textareaId} className="block text-sm font-semibold text-gray-700">
        Notes
        <span className="font-normal text-gray-400 ml-1">(optional)</span>
      </label>
      <p className="text-xs text-gray-500">Add any observations about this measurement</p>

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
          placeholder='e.g., "Used visual supports", "After break time"'
          rows={3}
          className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl outline-none resize-none transition-colors focus:border-violet-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <div
          className={`absolute bottom-2 right-3 text-xs ${
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
// Main Modal Component
// ============================================================================

export function IEPDataEntryModal({ goal, isOpen, onClose, onSuccess }: IEPDataEntryModalProps) {
  const form = useIEPDataEntryForm({
    goal,
    onSuccess: (dataPoint) => {
      onSuccess?.(dataPoint);
      onClose();
    },
  });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !form.isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, form.isSubmitting]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await form.submit();
    },
    [form],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => !form.isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative w-full max-w-lg max-h-[95vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up sm:animate-fade-in">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add Data Point</h2>
              <p className="text-sm text-gray-500">Record a new measurement</p>
            </div>
            <button
              onClick={onClose}
              disabled={form.isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6">
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
            <DatePicker
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
            <NotesInput
              value={form.data.notes}
              onChange={form.setNotes}
              disabled={form.isSubmitting}
            />

            {/* Evidence Upload */}
            <IEPEvidenceUpload
              value={form.data.evidence}
              onChange={form.setEvidence}
              disabled={form.isSubmitting}
            />
          </form>

          {/* Footer Actions */}
          <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={form.isSubmitting}
              className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={form.isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-70"
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
      </div>
    </>
  );
}

// ============================================================================
// Export
// ============================================================================

export default IEPDataEntryModal;

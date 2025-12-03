'use client';

import { useCallback, useMemo, useReducer } from 'react';
import type { IEPGoal, IEPMeasurementContext, IEPDataPoint } from '../../types/iep';
import type { EvidenceFile } from './IEPEvidenceUpload';

// ============================================================================
// Types
// ============================================================================

export interface DataEntryFormData {
  value: string;
  date: string;
  context: IEPMeasurementContext | null;
  notes: string;
  evidence: EvidenceFile | null;
}

export interface FormErrors {
  value?: string;
  date?: string;
  context?: string;
}

export interface FormState {
  data: DataEntryFormData;
  errors: FormErrors;
  touched: Record<keyof DataEntryFormData, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

type FormAction =
  | {
      type: 'SET_VALUE';
      field: keyof DataEntryFormData;
      value: DataEntryFormData[keyof DataEntryFormData];
    }
  | { type: 'SET_ERRORS'; errors: FormErrors }
  | { type: 'TOUCH_FIELD'; field: keyof DataEntryFormData }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'RESET' }
  | { type: 'VALIDATE' };

// ============================================================================
// Initial State
// ============================================================================

function getInitialState(): FormState {
  const today = new Date().toISOString().split('T')[0];
  return {
    data: {
      value: '',
      date: today,
      context: null,
      notes: '',
      evidence: null,
    },
    errors: {},
    touched: {
      value: false,
      date: false,
      context: false,
      notes: false,
      evidence: false,
    },
    isSubmitting: false,
    isValid: false,
  };
}

// ============================================================================
// Validation
// ============================================================================

function validateForm(data: DataEntryFormData): FormErrors {
  const errors: FormErrors = {};

  // Value validation
  if (!data.value.trim()) {
    errors.value = 'Value is required';
  } else {
    const numValue = parseFloat(data.value);
    if (isNaN(numValue)) {
      errors.value = 'Please enter a valid number';
    } else if (numValue < 0) {
      errors.value = 'Value cannot be negative';
    } else if (numValue > 1000000) {
      errors.value = 'Value is too large';
    }
  }

  // Date validation
  if (!data.date) {
    errors.date = 'Date is required';
  } else {
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      errors.date = 'Date cannot be in the future';
    }
  }

  // Context validation
  if (!data.context) {
    errors.context = 'Please select a context';
  }

  return errors;
}

// ============================================================================
// Reducer
// ============================================================================

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_VALUE': {
      const newData = { ...state.data, [action.field]: action.value };
      const errors = validateForm(newData);
      return {
        ...state,
        data: newData,
        errors,
        isValid: Object.keys(errors).length === 0,
      };
    }

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.errors,
        isValid: Object.keys(action.errors).length === 0,
      };

    case 'TOUCH_FIELD':
      return {
        ...state,
        touched: { ...state.touched, [action.field]: true },
      };

    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };

    case 'RESET':
      return getInitialState();

    case 'VALIDATE': {
      const errors = validateForm(state.data);
      return {
        ...state,
        errors,
        isValid: Object.keys(errors).length === 0,
        touched: {
          value: true,
          date: true,
          context: true,
          notes: true,
          evidence: true,
        },
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

interface UseIEPDataEntryFormOptions {
  goal: IEPGoal;
  onSuccess?: (dataPoint: IEPDataPoint) => void;
  onError?: (error: Error) => void;
}

export function useIEPDataEntryForm({ goal, onSuccess, onError }: UseIEPDataEntryFormOptions) {
  const [state, dispatch] = useReducer(formReducer, undefined, getInitialState);

  // Get recent unique values for quick selection
  const recentValues = useMemo(() => {
    const values = goal.dataPoints
      .slice()
      .sort((a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime())
      .map((dp) => dp.value);

    // Get unique values, keeping order
    const unique: number[] = [];
    for (const v of values) {
      if (!unique.includes(v) && unique.length < 4) {
        unique.push(v);
      }
    }
    return unique;
  }, [goal.dataPoints]);

  // Field setters
  const setValue = useCallback((value: string) => {
    dispatch({ type: 'SET_VALUE', field: 'value', value });
  }, []);

  const setDate = useCallback((date: string) => {
    dispatch({ type: 'SET_VALUE', field: 'date', value: date });
  }, []);

  const setContext = useCallback((context: IEPMeasurementContext | null) => {
    dispatch({ type: 'SET_VALUE', field: 'context', value: context });
  }, []);

  const setNotes = useCallback((notes: string) => {
    dispatch({ type: 'SET_VALUE', field: 'notes', value: notes });
  }, []);

  const setEvidence = useCallback((evidence: EvidenceFile | null) => {
    dispatch({ type: 'SET_VALUE', field: 'evidence', value: evidence });
  }, []);

  // Touch field (for showing errors after interaction)
  const touchField = useCallback((field: keyof DataEntryFormData) => {
    dispatch({ type: 'TOUCH_FIELD', field });
  }, []);

  // Reset form
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Submit form
  const submit = useCallback(async () => {
    // Validate all fields
    dispatch({ type: 'VALIDATE' });

    const errors = validateForm(state.data);
    if (Object.keys(errors).length > 0) {
      return false;
    }

    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });

    try {
      // TODO: Upload evidence file if present
      let evidenceUrl: string | undefined;
      if (state.data.evidence) {
        // In a real app, upload to cloud storage
        // evidenceUrl = await uploadFile(state.data.evidence.file);
        evidenceUrl = URL.createObjectURL(state.data.evidence.file);
      }

      // Create data point
      const dataPoint: IEPDataPoint = {
        id: `dp-${Date.now()}`,
        goalId: goal.id,
        value: parseFloat(state.data.value),
        measurementDate: state.data.date,
        context: state.data.context as IEPMeasurementContext,
        notes: state.data.notes.trim() || undefined,
        evidenceUrl,
        recordedBy: 'You', // TODO: Get from auth context
        createdAt: new Date().toISOString(),
      };

      // TODO: API call to save data point
      await new Promise((resolve) => setTimeout(resolve, 500));

      onSuccess?.(dataPoint);
      return true;
    } catch (error) {
      onError?.(error as Error);
      return false;
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  }, [state.data, goal.id, onSuccess, onError]);

  // Get error for field (only show if touched)
  const getFieldError = useCallback(
    (field: keyof FormErrors): string | undefined => {
      return state.touched[field] ? state.errors[field] : undefined;
    },
    [state.touched, state.errors],
  );

  return {
    // Form data
    data: state.data,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,

    // Derived data
    recentValues,
    unit: goal.unit,
    goalName: goal.name,
    currentValue: goal.currentValue,
    targetValue: goal.targetValue,

    // Field setters
    setValue,
    setDate,
    setContext,
    setNotes,
    setEvidence,

    // Actions
    touchField,
    getFieldError,
    reset,
    submit,
  };
}

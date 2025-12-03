'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { type EmotionType, type EmotionOption, EMOTION_OPTIONS } from '../hooks/useEmotionCheckIn';

// ============================================================================
// Types
// ============================================================================

interface EmotionCheckInModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when an emotion is selected and submitted */
  onComplete: (emotion: EmotionType, intensity: number) => void;
  /** Called when user skips the check-in */
  onSkip: () => void;
  /** Called when modal should close */
  onClose: () => void;
  /** Whether to disable animations (sensory preference) */
  reduceMotion?: boolean;
}

// ============================================================================
// Intensity Labels
// ============================================================================

const INTENSITY_LABELS: Record<number, string> = {
  1: 'A little',
  2: 'Somewhat',
  3: 'Moderately',
  4: 'Quite a bit',
  5: 'A lot',
};

// ============================================================================
// Emotion Button Component
// ============================================================================

interface EmotionButtonProps {
  option: EmotionOption;
  isSelected: boolean;
  onClick: () => void;
  reduceMotion?: boolean;
}

function EmotionButton({ option, isSelected, onClick, reduceMotion }: EmotionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={reduceMotion ? {} : { scale: 1.05 }}
      whileTap={reduceMotion ? {} : { scale: 0.95 }}
      className={`
        flex flex-col items-center justify-center p-4 rounded-2xl
        transition-colors min-w-[90px]
        ${isSelected ? 'ring-2 ring-offset-2' : 'bg-gray-100 hover:bg-gray-200'}
      `}
      style={{
        backgroundColor: isSelected ? `${option.color}25` : undefined,
        // @ts-expect-error CSS custom property
        '--tw-ring-color': isSelected ? option.color : 'transparent',
      }}
      aria-pressed={isSelected}
      aria-label={`${option.label} emotion`}
    >
      <span className="text-4xl mb-2" role="img" aria-hidden="true">
        {option.emoji}
      </span>
      <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
        {option.label}
      </span>
    </motion.button>
  );
}

// ============================================================================
// Intensity Slider Component
// ============================================================================

interface IntensitySliderProps {
  value: number;
  onChange: (value: number) => void;
  color: string;
}

function IntensitySlider({ value, onChange, color }: IntensitySliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-gray-600">
        <span>A little</span>
        <span className="font-medium text-gray-900">{INTENSITY_LABELS[value]}</span>
        <span>A lot</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={1}
          max={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            // Custom slider styling
            accentColor: color,
          }}
          aria-label="Emotion intensity"
        />
        {/* Tick marks */}
        <div className="flex justify-between px-1 mt-1">
          {[1, 2, 3, 4, 5].map((tick) => (
            <div
              key={tick}
              className={`w-2 h-2 rounded-full transition-colors ${
                tick <= value ? '' : 'bg-gray-300'
              }`}
              style={{
                backgroundColor: tick <= value ? color : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Thank You Message Component
// ============================================================================

interface ThankYouMessageProps {
  emotion: EmotionOption;
  intensity: number;
}

function ThankYouMessage({ emotion, intensity }: ThankYouMessageProps) {
  const getMessage = () => {
    // Positive emotions
    if (['happy', 'calm', 'excited'].includes(emotion.type)) {
      return "That's wonderful! Let's keep that positive energy going! 🌟";
    }
    // Tired
    if (emotion.type === 'tired') {
      return "It's okay to feel tired. Take your time today, or maybe a short break would help! 💤";
    }
    // Challenging emotions
    if (['anxious', 'frustrated', 'sad', 'angry'].includes(emotion.type)) {
      if (intensity >= 4) {
        return "Thank you for sharing. Remember, it's okay to take a break in the Calm Corner whenever you need. 🧘";
      }
      return "Thanks for letting us know. We'll make sure to go at your pace today. 💚";
    }
    return 'Thanks for checking in! Ready to learn? 📚';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-6"
    >
      <span className="text-6xl mb-4 block">{emotion.emoji}</span>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Thanks for sharing!</h3>
      <p className="text-gray-600 text-sm max-w-xs mx-auto">{getMessage()}</p>
    </motion.div>
  );
}

// ============================================================================
// Main Modal Component
// ============================================================================

export function EmotionCheckInModal({
  isOpen,
  onComplete,
  onSkip,
  onClose,
  reduceMotion = false,
}: EmotionCheckInModalProps) {
  // Track state for the modal
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [showThankYou, setShowThankYou] = useState(false);
  const [submittedEmotion, setSubmittedEmotion] = useState<EmotionOption | null>(null);
  const [wasOpen, setWasOpen] = useState(false);

  // Reset state when modal opens (track previous open state)
  if (isOpen && !wasOpen) {
    setWasOpen(true);
    setSelectedEmotion(null);
    setIntensity(3);
    setShowThankYou(false);
    setSubmittedEmotion(null);
  } else if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  // Lock body scroll when modal is open
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

  const handleEmotionSelect = useCallback((emotion: EmotionType) => {
    setSelectedEmotion(emotion);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedEmotion) return;

    const emotionOption = EMOTION_OPTIONS.find((e) => e.type === selectedEmotion);
    if (emotionOption) {
      setSubmittedEmotion(emotionOption);
      setShowThankYou(true);

      // Call onComplete after a short delay to show thank you
      setTimeout(() => {
        onComplete(selectedEmotion, intensity);
      }, 2000);
    }
  }, [selectedEmotion, intensity, onComplete]);

  const handleSkip = useCallback(() => {
    onSkip();
    onClose();
  }, [onSkip, onClose]);

  const selectedOption = selectedEmotion
    ? EMOTION_OPTIONS.find((e) => e.type === selectedEmotion)
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleSkip}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: 20 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.3, type: 'spring', damping: 25 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="emotion-checkin-title"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-lavender)] px-6 py-5">
                <button
                  onClick={handleSkip}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <h2 id="emotion-checkin-title" className="text-xl font-bold text-white">
                  How are you feeling?
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  This helps us personalize your learning experience
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                {showThankYou && submittedEmotion ? (
                  <ThankYouMessage emotion={submittedEmotion} intensity={intensity} />
                ) : (
                  <>
                    {/* Emotion Grid */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      {EMOTION_OPTIONS.map((option) => (
                        <EmotionButton
                          key={option.type}
                          option={option}
                          isSelected={selectedEmotion === option.type}
                          onClick={() => handleEmotionSelect(option.type)}
                          reduceMotion={reduceMotion}
                        />
                      ))}
                    </div>

                    {/* Intensity Slider (only show when emotion selected) */}
                    <AnimatePresence>
                      {selectedOption && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6 overflow-hidden"
                        >
                          <div className="pt-4 border-t">
                            <p className="text-sm font-medium text-gray-700 mb-4">
                              How strong is this feeling?
                            </p>
                            <IntensitySlider
                              value={intensity}
                              onChange={setIntensity}
                              color={selectedOption.color}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleSkip}
                        className="flex-1 py-3 px-4 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        Skip for now
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!selectedEmotion}
                        className={`
                          flex-[2] py-3 px-4 font-semibold rounded-xl transition-all
                          ${
                            selectedEmotion
                              ? 'bg-[var(--color-primary)] text-white hover:opacity-90'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        Continue
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { EmotionCheckInModalProps };

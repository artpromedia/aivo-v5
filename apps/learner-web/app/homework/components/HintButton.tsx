/**
 * HintButton - Request hints with remaining count display
 * 
 * Shows a friendly hint request button with:
 * - Remaining hints indicator
 * - Current hint display
 * - Hint type selection
 */

"use client";

import { useState, useCallback } from "react";

interface HintButtonProps {
  hintsRemaining: number;
  onRequestHint: (hintType?: string) => Promise<void> | void;
  disabled?: boolean;
  currentHint?: string | null;
  maxHints?: number;
}

const HINT_TYPES = [
  { id: "NUDGE", label: "Give me a nudge", emoji: "👉", description: "A gentle pointer" },
  { id: "EXPLANATION", label: "Explain something", emoji: "💡", description: "Help me understand" },
  { id: "EXAMPLE", label: "Show an example", emoji: "📝", description: "A similar problem" },
  { id: "DIRECT", label: "More help", emoji: "🎯", description: "Direct guidance" }
];

export function HintButton({
  hintsRemaining,
  onRequestHint,
  disabled = false,
  currentHint = null,
  maxHints = 3
}: HintButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestHint = useCallback(async (hintType?: string) => {
    setLoading(true);
    try {
      await onRequestHint(hintType);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  }, [onRequestHint]);

  const canRequestHint = hintsRemaining > 0 && !disabled && !loading;

  return (
    <div className="relative">
      {/* Hint button */}
      <button
        type="button"
        onClick={() => canRequestHint && setIsOpen(!isOpen)}
        disabled={!canRequestHint}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl font-medium
          transition-all duration-200
          ${canRequestHint
            ? "bg-sunshine/20 text-sunshine-dark hover:bg-sunshine/30"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Request hint. ${hintsRemaining} hints remaining`}
      >
        <span className="text-lg">💡</span>
        <span>Need a hint?</span>
        <span
          className={`
            ml-1 px-2 py-0.5 rounded-full text-xs font-bold
            ${hintsRemaining > 0 ? "bg-sunshine text-white" : "bg-slate-300 text-slate-600"}
          `}
        >
          {hintsRemaining}
        </span>
      </button>

      {/* Hints remaining indicator */}
      <div className="mt-1 flex justify-center gap-1" aria-hidden="true">
        {Array.from({ length: maxHints }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < hintsRemaining ? "bg-sunshine" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Dropdown for hint types */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu */}
          <div
            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="p-3 bg-lavender-50 border-b border-lavender-100">
              <p className="text-sm font-medium text-slate-700">
                What kind of help do you need?
              </p>
            </div>
            
            <div className="p-2">
              {HINT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleRequestHint(type.id)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-lavender-50 transition-colors text-left"
                  role="menuitem"
                >
                  <span className="text-xl">{type.emoji}</span>
                  <div>
                    <p className="font-medium text-slate-700">{type.label}</p>
                    <p className="text-xs text-slate-500">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick hint button */}
            <div className="p-3 border-t border-slate-100">
              <button
                onClick={() => handleRequestHint()}
                disabled={loading}
                className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Getting hint...
                  </span>
                ) : (
                  "Just give me any hint"
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Current hint display */}
      {currentHint && (
        <div className="mt-4 p-4 bg-sunshine/10 border border-sunshine/30 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-medium text-sunshine-dark mb-1">Here's a hint:</p>
              <p className="text-slate-700">{currentHint}</p>
            </div>
          </div>
        </div>
      )}

      {/* No hints remaining message */}
      {hintsRemaining === 0 && (
        <p className="mt-2 text-xs text-slate-500 text-center">
          No more hints for this step. You can do it! 💪
        </p>
      )}
    </div>
  );
}

/**
 * Calm Corner Floating Action Button
 * Provides quick access to calm corner / regulation features
 *
 * Ported from Flutter: mobile/learner_flutter/lib/widgets/calm_corner_fab.dart
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface CalmCornerFabProps {
  showPulse?: boolean;
  focusScore?: number;
  onNavigate?: (destination: 'games' | 'breathing' | 'full') => void;
}

export function CalmCornerFab({ showPulse = false, focusScore, onNavigate }: CalmCornerFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(showPulse);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsPulsing(showPulse);
  }, [showPulse]);

  // Close sheet when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle keyboard escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleOptionClick = (destination: 'games' | 'breathing' | 'full') => {
    setIsOpen(false);
    onNavigate?.(destination);
  };

  const getFocusMessage = (score: number) => {
    if (score >= 80) return 'Great focus! Keep it up! 🌟';
    if (score >= 60) return 'Doing well! A short break might help.';
    if (score >= 40) return 'Time for a brain break! 🧠';
    return "Let's recharge with a fun activity!";
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className={`
            relative flex items-center gap-2 px-5 py-3 rounded-full shadow-lg
            transition-all duration-300 hover:scale-105
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
            ${
              isPulsing
                ? 'bg-teal-500 text-white animate-pulse'
                : 'bg-teal-400 text-gray-900 hover:bg-teal-500'
            }
          `}
          aria-label={isPulsing ? 'Take a Break' : 'Open Calm Corner'}
        >
          {/* Pulse ring effect */}
          {isPulsing && (
            <span className="absolute inset-0 rounded-full animate-ping bg-teal-400 opacity-40" />
          )}

          <span className="text-xl">🧘</span>
          <span className="font-semibold relative z-10">
            {isPulsing ? 'Take a Break' : 'Calm Corner'}
          </span>

          {/* Notification badge */}
          {isPulsing && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
              !
            </span>
          )}
        </button>
      </div>

      {/* Options Sheet (Modal) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 animate-fadeIn">
          <div
            ref={sheetRef}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slideUp"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calm-corner-title"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧘</span>
                  <div>
                    <h2 id="calm-corner-title" className="text-xl font-bold text-gray-800">
                      Calm Corner
                    </h2>
                    <p className="text-sm text-gray-500">Take a moment for yourself</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <OptionTile
                  emoji="🎮"
                  title="Play a Game"
                  subtitle="Fun brain breaks to refresh your mind"
                  color="violet"
                  onClick={() => handleOptionClick('games')}
                />

                <OptionTile
                  emoji="🌬️"
                  title="Breathing Exercise"
                  subtitle="Calm breathing to relax"
                  color="sky"
                  onClick={() => handleOptionClick('breathing')}
                />

                <OptionTile
                  emoji="🎨"
                  title="Full Calm Corner"
                  subtitle="All tools and activities"
                  color="teal"
                  onClick={() => handleOptionClick('full')}
                />
              </div>

              {/* Focus Score (if available) */}
              {focusScore !== undefined && (
                <div className="mt-6 p-4 bg-lavender-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <FocusScoreIndicator score={focusScore} />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">Focus Level</div>
                      <div className="text-sm text-gray-500">{getFocusMessage(focusScore)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Safe area spacer for mobile */}
            <div className="h-6 sm:h-0" />
          </div>
        </div>
      )}

      {/* Global animations are defined in tailwind config */}
    </>
  );
}

interface OptionTileProps {
  emoji: string;
  title: string;
  subtitle: string;
  color: 'violet' | 'sky' | 'teal';
  onClick: () => void;
}

function OptionTile({ emoji, title, subtitle, color, onClick }: OptionTileProps) {
  const colorClasses = {
    violet: 'bg-violet-50 border-violet-200 hover:bg-violet-100',
    sky: 'bg-sky-50 border-sky-200 hover:bg-sky-100',
    teal: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
  };

  const iconColor = {
    violet: 'text-violet-500',
    sky: 'text-sky-500',
    teal: 'text-teal-500',
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-4 p-4 rounded-2xl border transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
        ${colorClasses[color]}
      `}
    >
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
        <span className="text-2xl">{emoji}</span>
      </div>
      <div className="flex-1 text-left">
        <div className="font-semibold text-gray-800">{title}</div>
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>
      <ChevronRight className={`w-5 h-5 ${iconColor[color]}`} />
    </button>
  );
}

interface FocusScoreIndicatorProps {
  score: number;
}

function FocusScoreIndicator({ score }: FocusScoreIndicatorProps) {
  const getScoreColor = () => {
    if (score >= 80) return '#10b981'; // emerald-500
    if (score >= 60) return '#14b8a6'; // teal-500
    if (score >= 40) return '#f59e0b'; // amber-500
    return '#f43f5e'; // rose-500
  };

  const color = getScoreColor();
  const circumference = 2 * Math.PI * 22; // radius = 22
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-14 h-14">
      <svg className="w-14 h-14 transform -rotate-90">
        {/* Background circle */}
        <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
        {/* Progress circle */}
        <circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-bold text-sm"
        style={{ color }}
      >
        {Math.round(score)}
      </div>
    </div>
  );
}

export default CalmCornerFab;

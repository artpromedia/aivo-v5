'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DistrictPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'NONE' | 'PILOT_ACTIVE' | 'PILOT_EXPIRED' | 'PILOT_CANCELLED' | 'ACTIVE';
  districtName: string;
  pilotEndsAt: Date | null;
  daysRemaining: number;
  usageLimits: { learners: number; schools: number } | null;
  currentUsage: { learners: number; schools: number } | null;
  onStartPilot: () => void;
  onContactSales: () => void;
  onDismiss?: () => void;
}

export function DistrictPilotModal({
  isOpen,
  onClose,
  status,
  districtName,
  pilotEndsAt,
  daysRemaining,
  usageLimits,
  currentUsage,
  onStartPilot,
  onContactSales,
  onDismiss,
}: DistrictPilotModalProps) {
  // Track if component is mounted for portal rendering (SSR-safe)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    requestAnimationFrame(() => {
      if (!isCancelled) {
        setMounted(true);
      }
    });
    return () => {
      isCancelled = true;
      setMounted(false);
    };
  }, []);

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

  if (!isOpen || !mounted) return null;

  const getModalContent = () => {
    switch (status) {
      case 'NONE':
        return (
          <WelcomePilotContent
            districtName={districtName}
            onStartPilot={onStartPilot}
            onDismiss={onDismiss}
          />
        );
      case 'PILOT_ACTIVE':
        return (
          <PilotActiveContent
            districtName={districtName}
            daysRemaining={daysRemaining}
            pilotEndsAt={pilotEndsAt}
            usageLimits={usageLimits}
            currentUsage={currentUsage}
            onContactSales={onContactSales}
            onDismiss={onClose}
          />
        );
      case 'PILOT_EXPIRED':
      case 'PILOT_CANCELLED':
        return (
          <PilotEndedContent
            districtName={districtName}
            status={status}
            onContactSales={onContactSales}
          />
        );
      case 'ACTIVE':
        return null; // No modal needed for active subscriptions
      default:
        return null;
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pilot-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={status === 'PILOT_ACTIVE' ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        {getModalContent()}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

// Welcome content for districts that haven't started pilot
function WelcomePilotContent({
  districtName,
  onStartPilot,
  onDismiss,
}: {
  districtName: string;
  onStartPilot: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="p-8 text-center">
      {/* Icon */}
      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>

      <h2 id="pilot-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Welcome, {districtName}! 🏫
      </h2>

      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Start your{' '}
        <span className="font-semibold text-emerald-600">free 90-day district pilot</span> and
        transform personalized learning across your schools.
      </p>

      {/* Features list */}
      <div className="text-left bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          District pilot includes:
        </h3>
        <ul className="space-y-2">
          {[
            'Full enterprise access for 90 days',
            'Up to 500 learner accounts',
            'Up to 10 schools',
            'District-wide analytics & reporting',
            'Admin dashboard access',
            'Teacher training resources',
            'Dedicated support team',
          ].map((feature, idx) => (
            <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <svg
                className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        No payment required during pilot. Cancel anytime.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={onStartPilot}
          className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Start 90-Day Pilot
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
}

// Active pilot content with countdown
function PilotActiveContent({
  districtName,
  daysRemaining,
  pilotEndsAt,
  usageLimits,
  currentUsage,
  onContactSales,
  onDismiss,
}: {
  districtName: string;
  daysRemaining: number;
  pilotEndsAt: Date | null;
  usageLimits: { learners: number; schools: number } | null;
  currentUsage: { learners: number; schools: number } | null;
  onContactSales: () => void;
  onDismiss: () => void;
}) {
  const isUrgent = daysRemaining <= 14;
  const isLastWeek = daysRemaining <= 7;

  return (
    <div className="p-8 text-center">
      {/* Countdown circle */}
      <div
        className={`mx-auto w-24 h-24 rounded-full flex flex-col items-center justify-center mb-6 ${
          isLastWeek
            ? 'bg-red-100 dark:bg-red-900'
            : isUrgent
              ? 'bg-yellow-100 dark:bg-yellow-900'
              : 'bg-emerald-100 dark:bg-emerald-900'
        }`}
      >
        <span
          className={`text-3xl font-bold ${
            isLastWeek
              ? 'text-red-600 dark:text-red-400'
              : isUrgent
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {daysRemaining}
        </span>
        <span
          className={`text-xs ${
            isLastWeek ? 'text-red-500' : isUrgent ? 'text-yellow-500' : 'text-emerald-500'
          }`}
        >
          {daysRemaining === 1 ? 'day left' : 'days left'}
        </span>
      </div>

      <h2 id="pilot-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {isLastWeek
          ? `${districtName}'s Pilot Ending Soon!`
          : isUrgent
            ? `${districtName}'s Pilot Update`
            : `${districtName}'s District Pilot`}
      </h2>

      <p className="text-gray-600 dark:text-gray-300 mb-2">
        {isLastWeek
          ? 'Contact our sales team now to ensure uninterrupted service.'
          : isUrgent
            ? "Your pilot is ending soon. Let's discuss your subscription options."
            : "Your pilot is active. Here's your usage summary."}
      </p>

      {pilotEndsAt && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Pilot ends on{' '}
          {new Date(pilotEndsAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      )}

      {/* Usage stats */}
      {usageLimits && currentUsage && (
        <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Pilot Usage</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {currentUsage.learners}
                <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                  /{usageLimits.learners}
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Learners</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {currentUsage.schools}
                <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                  /{usageLimits.schools}
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Schools</p>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise pricing preview */}
      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-left">
            <p className="font-semibold text-gray-900 dark:text-white">Enterprise Plan</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Custom pricing for districts</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              Contact Sales
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onContactSales}
          className={`w-full py-3 px-6 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isUrgent
              ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white focus:ring-red-500'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white focus:ring-emerald-500'
          }`}
        >
          Contact Sales Team
        </button>
        <button
          onClick={onDismiss}
          className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Continue with pilot
        </button>
      </div>
    </div>
  );
}

// Pilot ended content
function PilotEndedContent({
  districtName,
  status,
  onContactSales,
}: {
  districtName: string;
  status: 'PILOT_EXPIRED' | 'PILOT_CANCELLED';
  onContactSales: () => void;
}) {
  const isCancelled = status === 'PILOT_CANCELLED';

  return (
    <div className="p-8 text-center">
      {/* Icon */}
      <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-red-600 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h2 id="pilot-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {isCancelled ? 'Pilot Cancelled' : 'Pilot Expired'}
      </h2>

      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {isCancelled
          ? `${districtName}'s pilot was cancelled. Contact our sales team to discuss subscription options.`
          : `${districtName}'s 90-day pilot has ended. Subscribe to continue providing personalized learning for your students.`}
      </p>

      {/* What you're missing */}
      <div className="text-left bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          What your district is missing:
        </h3>
        <ul className="space-y-2">
          {[
            'Continued student progress',
            'District-wide analytics',
            'Teacher access to dashboards',
            'AI-powered learning sessions',
            'Progress reports & insights',
          ].map((feature, idx) => (
            <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <svg
                className="w-5 h-5 text-red-500 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onContactSales}
        className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        Contact Sales Team
      </button>
    </div>
  );
}

export default DistrictPilotModal;

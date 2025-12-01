'use client';

import { useDistrictPilot } from './DistrictPilotProvider';

interface DistrictPilotBannerProps {
  onContactSalesClick?: () => void;
}

export function DistrictPilotBanner({ onContactSalesClick }: DistrictPilotBannerProps) {
  const { pilotInfo, setShowPilotModal } = useDistrictPilot();

  if (!pilotInfo) return null;

  const handleClick = () => {
    if (onContactSalesClick) {
      onContactSalesClick();
    } else {
      setShowPilotModal(true);
    }
  };

  // Only show for pilot districts
  if (!pilotInfo.isInPilot) return null;

  const daysRemaining = pilotInfo.daysRemaining;
  const isUrgent = daysRemaining <= 14;
  const isLastWeek = daysRemaining <= 7;

  return (
    <div
      className={`px-4 py-2 text-center text-sm font-medium transition-colors ${
        isLastWeek
          ? 'bg-red-500 text-white'
          : isUrgent
            ? 'bg-yellow-400 text-yellow-900'
            : 'bg-emerald-600 text-white'
      }`}
    >
      <span>
        {isLastWeek
          ? `⚠️ ${pilotInfo.districtName}'s pilot ending in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}! `
          : isUrgent
            ? `⏰ ${daysRemaining} days left in ${pilotInfo.districtName}'s pilot. `
            : `🏫 ${pilotInfo.districtName}: ${daysRemaining} days left in district pilot. `}
      </span>
      <button
        onClick={handleClick}
        className={`underline font-semibold hover:no-underline ${
          isLastWeek ? 'text-white' : isUrgent ? 'text-yellow-900' : 'text-white'
        }`}
      >
        {isLastWeek || isUrgent ? 'Contact sales' : 'View pilot status'}
      </button>

      {/* Usage info */}
      {pilotInfo.maxLearners && (
        <span className="ml-4 opacity-80">
          | Learners: {pilotInfo.currentLearners}/{pilotInfo.maxLearners}
        </span>
      )}
    </div>
  );
}

export default DistrictPilotBanner;

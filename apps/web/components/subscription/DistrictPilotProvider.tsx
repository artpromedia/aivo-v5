'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { SubscriptionStatus, SubscriptionTier, PilotInfo } from '@aivo/types';
import {
  calculatePilotDaysRemaining,
  canAccessPlatform,
  requiresPayment,
  isPilotStatus,
} from '@aivo/types';

interface DistrictPilotInfo extends PilotInfo {
  currentLearners: number;
  currentSchools: number;
  canAccessPlatform: boolean;
  requiresPayment: boolean;
}

interface DistrictPilotContextValue {
  pilotInfo: DistrictPilotInfo | null;
  isLoading: boolean;
  error: string | null;
  startPilot: (districtId: string, maxLearners?: number, maxSchools?: number) => Promise<boolean>;
  cancelPilot: (districtId: string, reason?: string) => Promise<boolean>;
  refreshPilotStatus: (districtId: string) => Promise<void>;
  checkPilotEligibility: (
    districtId: string,
  ) => Promise<{ canStartPilot: boolean; reason?: string }>;
  showPilotModal: boolean;
  setShowPilotModal: (show: boolean) => void;
}

const DistrictPilotContext = createContext<DistrictPilotContextValue | null>(null);

interface DistrictPilotProviderProps {
  children: ReactNode;
  districtId?: string; // Optional: auto-fetch pilot status for this district
}

export function DistrictPilotProvider({ children, districtId }: DistrictPilotProviderProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [pilotInfo, setPilotInfo] = useState<DistrictPilotInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPilotModal, setShowPilotModal] = useState(false);

  // Fetch pilot status from API
  const fetchPilotStatus = useCallback(
    async (targetDistrictId: string) => {
      if (!session?.user?.id || !targetDistrictId) {
        setPilotInfo(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/subscription/pilot/status?districtId=${targetDistrictId}`,
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch pilot status');
        }

        const data = await response.json();

        const pilotInfoData: DistrictPilotInfo = {
          isInPilot: data.isInPilot,
          pilotStartedAt: data.pilotStartedAt ? new Date(data.pilotStartedAt) : null,
          pilotEndsAt: data.pilotEndsAt ? new Date(data.pilotEndsAt) : null,
          daysRemaining: data.pilotEndsAt
            ? calculatePilotDaysRemaining(new Date(data.pilotEndsAt))
            : 0,
          hasUsedPilot: data.hasUsedPilot ?? false,
          districtId: data.districtId,
          districtName: data.districtName,
          maxLearners: data.maxLearners,
          maxSchools: data.maxSchools,
          currentLearners: data.currentLearners ?? 0,
          currentSchools: data.currentSchools ?? 0,
          canAccessPlatform: data.canAccessPlatform,
          requiresPayment: data.requiresPayment,
        };

        setPilotInfo(pilotInfoData);

        // Auto-show pilot modal for districts that need it
        const status = data.status as SubscriptionStatus;
        if (
          status === 'NONE' ||
          status === 'PILOT_EXPIRED' ||
          status === 'PILOT_CANCELLED' ||
          (status === 'PILOT_ACTIVE' && pilotInfoData.daysRemaining <= 14)
        ) {
          setShowPilotModal(true);
        }
      } catch (err) {
        console.error('Error fetching pilot status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id],
  );

  // Fetch pilot status on mount if districtId is provided
  useEffect(() => {
    if (sessionStatus === 'authenticated' && districtId) {
      fetchPilotStatus(districtId);
    } else if (sessionStatus === 'unauthenticated') {
      setPilotInfo(null);
      setIsLoading(false);
    }
  }, [sessionStatus, districtId, fetchPilotStatus]);

  // Start pilot
  const startPilot = useCallback(
    async (
      targetDistrictId: string,
      maxLearners?: number,
      maxSchools?: number,
    ): Promise<boolean> => {
      if (!session?.user?.id) return false;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/subscription/pilot/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ districtId: targetDistrictId, maxLearners, maxSchools }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to start pilot');
          return false;
        }

        // Refresh pilot status
        await fetchPilotStatus(targetDistrictId);
        setShowPilotModal(false);
        return true;
      } catch (err) {
        console.error('Error starting pilot:', err);
        setError(err instanceof Error ? err.message : 'Failed to start pilot');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id, fetchPilotStatus],
  );

  // Cancel pilot
  const cancelPilot = useCallback(
    async (targetDistrictId: string, reason?: string): Promise<boolean> => {
      if (!session?.user?.id) return false;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/subscription/pilot/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ districtId: targetDistrictId, reason }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to cancel pilot');
          return false;
        }

        // Refresh pilot status
        await fetchPilotStatus(targetDistrictId);
        return true;
      } catch (err) {
        console.error('Error cancelling pilot:', err);
        setError(err instanceof Error ? err.message : 'Failed to cancel pilot');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id, fetchPilotStatus],
  );

  // Check pilot eligibility
  const checkPilotEligibility = useCallback(
    async (targetDistrictId: string): Promise<{ canStartPilot: boolean; reason?: string }> => {
      if (!session?.user?.id) {
        return { canStartPilot: false, reason: 'Not authenticated' };
      }

      try {
        const response = await fetch(
          `/api/subscription/pilot/check?districtId=${targetDistrictId}`,
        );
        const data = await response.json();

        if (!response.ok) {
          return { canStartPilot: false, reason: data.error };
        }

        return {
          canStartPilot: data.canStartPilot,
          reason: data.reason,
        };
      } catch (err) {
        console.error('Error checking pilot eligibility:', err);
        return {
          canStartPilot: false,
          reason: err instanceof Error ? err.message : 'Failed to check eligibility',
        };
      }
    },
    [session?.user?.id],
  );

  const value: DistrictPilotContextValue = {
    pilotInfo,
    isLoading,
    error,
    startPilot,
    cancelPilot,
    refreshPilotStatus: fetchPilotStatus,
    checkPilotEligibility,
    showPilotModal,
    setShowPilotModal,
  };

  return <DistrictPilotContext.Provider value={value}>{children}</DistrictPilotContext.Provider>;
}

export function useDistrictPilot(): DistrictPilotContextValue {
  const context = useContext(DistrictPilotContext);

  if (!context) {
    throw new Error('useDistrictPilot must be used within a DistrictPilotProvider');
  }

  return context;
}

/**
 * Hook to check if the district can access platform features
 */
export function useDistrictAccess(): {
  canAccess: boolean;
  isInPilot: boolean;
  daysRemaining: number;
  districtName: string | null;
  usageLimits: { learners: number; schools: number } | null;
  currentUsage: { learners: number; schools: number } | null;
} {
  const { pilotInfo, isLoading } = useDistrictPilot();

  if (isLoading || !pilotInfo) {
    return {
      canAccess: false,
      isInPilot: false,
      daysRemaining: 0,
      districtName: null,
      usageLimits: null,
      currentUsage: null,
    };
  }

  return {
    canAccess: pilotInfo.canAccessPlatform,
    isInPilot: pilotInfo.isInPilot,
    daysRemaining: pilotInfo.daysRemaining,
    districtName: pilotInfo.districtName,
    usageLimits:
      pilotInfo.maxLearners && pilotInfo.maxSchools
        ? {
            learners: pilotInfo.maxLearners,
            schools: pilotInfo.maxSchools,
          }
        : null,
    currentUsage: {
      learners: pilotInfo.currentLearners,
      schools: pilotInfo.currentSchools,
    },
  };
}

export default DistrictPilotProvider;

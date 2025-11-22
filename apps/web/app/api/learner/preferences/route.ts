import { NextResponse } from 'next/server';
import type { LearnerPreferences } from '@/components/learn/types';

const defaultPreferences: LearnerPreferences = {
  learnerId: 'demo-learner',
  theme: 'theme-calm',
  showSchedule: true,
  focusReminders: true,
  sensory: {
    primaryColor: '#6d5dfc',
    backgroundColor: '#f6f8fb',
    contrast: 1,
    fontSize: 18,
    lineHeight: 1.65,
    reduceMotion: false,
    soundEnabled: false,
    soundVolume: 0.5
  },
  supports: {
    visualSchedule: true,
    progressCelebrations: true,
    chunkedText: true
  }
};

declare global {
  // eslint-disable-next-line no-var
  var __learnerPreferences: LearnerPreferences | undefined;
}

function readPreferences(): LearnerPreferences {
  if (!globalThis.__learnerPreferences) {
    globalThis.__learnerPreferences = defaultPreferences;
  }
  return globalThis.__learnerPreferences;
}

export async function GET() {
  return NextResponse.json(readPreferences());
}

export async function POST(request: Request) {
  const payload = (await request.json()) as LearnerPreferences;
  globalThis.__learnerPreferences = payload;
  return NextResponse.json(payload);
}

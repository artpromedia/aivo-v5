import { NextResponse } from 'next/server';
import type { ProgressSnapshot } from '@/components/learn/types';

const snapshot: ProgressSnapshot = {
  mastery: 72,
  focusScore: 88,
  streakDays: 5,
  badges: ['🌱', '🎯']
};

export async function GET() {
  return NextResponse.json(snapshot);
}

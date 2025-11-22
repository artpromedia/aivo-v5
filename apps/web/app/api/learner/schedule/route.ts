import { NextResponse } from 'next/server';
import type { ScheduleEntry } from '@/components/learn/types';

const baseSchedule: ScheduleEntry[] = [
  { id: 'warmup', title: 'Calm Warm-up', type: 'warmup', start: '08:00', durationMinutes: 5, status: 'complete', icon: '🌤️' },
  { id: 'lesson', title: 'Lesson Sprint', type: 'lesson', start: '08:05', durationMinutes: 20, status: 'in-progress', icon: '🧠' },
  { id: 'break', title: 'Movement Break', type: 'break', start: '08:25', durationMinutes: 5, status: 'upcoming', icon: '🤸' },
  { id: 'reflection', title: 'Reflection Bubble', type: 'reflection', start: '08:30', durationMinutes: 5, status: 'upcoming', icon: '💭' }
];

export async function GET() {
  return NextResponse.json({ schedule: baseSchedule });
}

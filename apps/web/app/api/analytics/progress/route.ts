import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLearningAnalytics, type TrendSummary } from "@/lib/analytics/learning-analytics";
import type { DomainType } from "@prisma/client";

const DOMAINS: DomainType[] = ["READING", "MATH", "SPEECH", "SEL", "SCIENCE"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get("learnerId");

  if (!learnerId) {
    return NextResponse.json({ error: "learnerId is required" }, { status: 400 });
  }

  const start = searchParams.get("start") ? new Date(searchParams.get("start") as string) : subtractDays(30);
  const end = searchParams.get("end") ? new Date(searchParams.get("end") as string) : new Date();

  try {
    const progress = await prisma.progress.findMany({
      where: {
        learnerId,
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: { date: "asc" }
    });

    const analyticsService = getLearningAnalytics();

  const domainStats = DOMAINS.reduce<Record<string, { current?: number; trend: TrendSummary }>>((acc, domain) => {
      const domainData = progress.filter((entry) => entry.domain === domain);
      acc[domain] = {
        current: domainData.at(-1)?.score ?? domainData.at(-1)?.level,
        trend: analyticsService.calculateTrend(domainData)
      };
      return acc;
    }, {});

    const timeline = buildTimeline(progress);
    const { dates, overallProgress, predicted } = buildSeries(timeline);

    const response = {
      current: DOMAINS.reduce<Record<string, number>>((acc, domain) => {
        acc[domain] = Number((domainStats[domain].current ?? 0).toFixed(1));
        return acc;
      }, {}),
      trends: DOMAINS.reduce<Record<string, ReturnType<typeof analyticsService.calculateTrend>>>((acc, domain) => {
        acc[domain] = domainStats[domain].trend;
        return acc;
      }, {}),
      dates,
      overallProgress,
      predicted,
      alerts: buildAlerts(domainStats),
      timeline: timeline.map((entry) => ({
        date: entry.date,
        domains: entry.domains
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to fetch analytics" }, { status: 500 });
  }
}

function subtractDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function buildTimeline(progress: { date: Date; domain: DomainType; score: number | null; level: number }[]) {
  const map = new Map<string, { date: string; domains: Record<DomainType, number> }>();

  progress.forEach((entry) => {
    const key = entry.date.toISOString().slice(0, 10);
    if (!map.has(key)) {
      map.set(key, { date: key, domains: { READING: 0, MATH: 0, SPEECH: 0, SEL: 0, SCIENCE: 0 } });
    }
    const bucket = map.get(key)!;
    bucket.domains[entry.domain] = Number((entry.score ?? entry.level ?? 0).toFixed(1));
  });

  return Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
}

function buildSeries(timeline: { date: string; domains: Record<DomainType, number> }[]) {
  if (!timeline.length) {
    return { dates: [], overallProgress: [], predicted: [] };
  }

  const dates = timeline.map((entry) => entry.date);
  const overallProgress = timeline.map((entry) => {
    const values = Object.values(entry.domains).filter(Boolean);
    return values.length ? Number((values.reduce((sum, score) => sum + score, 0) / values.length).toFixed(1)) : 0;
  });

  const predicted = generatePredictedSeries(overallProgress);

  return { dates, overallProgress, predicted };
}

function generatePredictedSeries(values: number[]) {
  if (values.length < 2) return values;

  const last = values.at(-1) ?? 0;
  const prev = values.at(-2) ?? last;
  const slope = last - prev;

  return values.map((value, index) => Number((value + slope * ((index + 1) / values.length) * 0.5).toFixed(1)));
}

function buildAlerts(domainStats: Record<string, { trend: { struggling: boolean; daysStruggling: number }; current?: number }>) {
  return Object.entries(domainStats)
    .filter(([, value]) => value.trend.struggling)
    .map(([domain, value]) => ({
      domain,
      severity: value.trend.daysStruggling > 3 ? "HIGH" : "MEDIUM",
      days: value.trend.daysStruggling
    }));
}

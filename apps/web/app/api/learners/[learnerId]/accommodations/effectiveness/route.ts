import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AccommodationType } from "@prisma/client";

export async function GET(_: Request, { params }: { params: { learnerId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await prisma.accommodationEffectiveness.findMany({
    where: { learnerId: params.learnerId },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  const summary = records.reduce<Record<AccommodationType, { count: number; engagement: number; completion: number; accuracy: number }>>(
    (acc, record) => {
      const key = record.accommodation;
      if (!acc[key]) {
        acc[key] = { count: 0, engagement: 0, completion: 0, accuracy: 0 };
      }
      acc[key].count += 1;
      acc[key].engagement += record.engagementWith ?? 0;
      acc[key].completion += record.completionRateWith ?? 0;
      acc[key].accuracy += record.accuracyWith ?? 0;
      return acc;
    },
    {} as Record<AccommodationType, { count: number; engagement: number; completion: number; accuracy: number }>
  );

  const averages = Object.entries(summary).map(([accommodation, stats]) => ({
    accommodation,
    engagement: stats.count ? stats.engagement / stats.count : 0,
    completion: stats.count ? stats.completion / stats.count : 0,
    accuracy: stats.count ? stats.accuracy / stats.count : 0,
    sampleSize: stats.count
  }));

  return NextResponse.json({ records, averages });
}

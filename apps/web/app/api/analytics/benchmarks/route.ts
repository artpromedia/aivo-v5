import { NextResponse } from "next/server";
import { getLearningAnalytics } from "@/lib/analytics/learning-analytics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get("learnerId");

  if (!learnerId) {
    return NextResponse.json({ error: "learnerId is required" }, { status: 400 });
  }

  try {
    const benchmarks = await getLearningAnalytics().compareToBenchmarks(learnerId);
    return NextResponse.json(benchmarks);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load benchmarks" }, { status: 500 });
  }
}

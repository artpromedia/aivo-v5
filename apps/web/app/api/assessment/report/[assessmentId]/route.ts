import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AssessmentResults } from "@/lib/types/assessment";

function formatDomainSection(results: AssessmentResults) {
  const entries = Object.entries(results.domainLevels) as [keyof AssessmentResults["domainLevels"], number][];
  return entries
    .map(([domain, level]) => {
      const summary = results.domainSummaries?.[domain] ?? "Awaiting reflection";
      return `- **${domain}**: Grade ${level} — ${summary}`;
    })
    .join("\n");
}

export async function GET(_request: Request, { params }: { params: { assessmentId: string } }) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.assessmentId }
    });

    if (!assessment?.results) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

  const results = assessment.results as unknown as AssessmentResults;

    const markdown = [
      `# Baseline Capability Report`,
      `Assessment ID: ${assessment.id}`,
      `Learner ID: ${assessment.learnerId}`,
      "",
      `## Overall Grade Readiness`,
      `- Calibrated level: **G${results.overallLevel}**`,
      `- Personalized learning profile: ${results.learningProfile ?? "Not captured"}`,
      "",
      `## Domain Highlights`,
      formatDomainSection(results),
      "",
      `## Strengths`,
      ...(results.strengths?.length ? results.strengths.map((item) => `- ${item}`) : ["- Not captured"]),
      "",
      `## Growth Edges`,
      ...(results.challenges?.length ? results.challenges.map((item) => `- ${item}`) : ["- Not captured"]),
      "",
      `## Recommended Next Steps`,
      ...(results.recommendations?.length
        ? results.recommendations.map((item) => `- ${item}`)
        : ["- Continue observing learner preferences."])
    ];

    return new NextResponse(markdown.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("Failed to build assessment report", error);
    return NextResponse.json({ error: "Unable to build assessment report" }, { status: 500 });
  }
}

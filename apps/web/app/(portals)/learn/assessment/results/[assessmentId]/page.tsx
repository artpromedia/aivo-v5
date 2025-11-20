import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { AssessmentDomainName, AssessmentResults } from "@/lib/types/assessment";
import { ReportDownloadButton, ShareReportButton } from "@/components/report-download-button";

const DOMAINS: AssessmentDomainName[] = ["READING", "MATH", "SPEECH", "SEL", "SCIENCE"];

interface DomainResponseEntry {
  id: string;
  domain: AssessmentDomainName;
  difficulty: number;
  type: string;
  isCorrect?: boolean;
}

export default async function AssessmentResultsPage({ params }: { params: { assessmentId: string } }) {
  const assessment = await prisma.assessment.findUnique({ where: { id: params.assessmentId } });

  const resultsPayload = (assessment as { results?: unknown })?.results;

  if (!resultsPayload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950/90 p-6 text-slate-50">
        <div className="rounded-2xl bg-slate-900/80 p-8 text-center text-lg shadow-soft-coral">
          <p>Assessment not found.</p>
          <Link href="/learn/assessment" className="mt-4 inline-block text-coral">
            Return to assessment
          </Link>
        </div>
      </div>
    );
  }

  const results = resultsPayload as AssessmentResults;
  const responseMap = buildDomainResponseMap(results);
  const completedAt = assessment?.completedAt ? new Date(assessment.completedAt) : null;

  const priorityRecommendation = results.recommendations.length
    ? results.recommendations.slice(0, 1)
    : ["Schedule a reflection check-in with your coach."];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-wide text-purple-500">Baseline completed</p>
              <h1 className="text-4xl font-semibold text-slate-900">Personalized capability map</h1>
              <p className="text-slate-600">
                Your AI tutor calibrated each domain to meet you where you are today.
                {completedAt && <span className="ml-2 text-sm text-slate-500">Finished {formatDate(completedAt)}</span>}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ReportDownloadButton assessmentId={params.assessmentId} />
              <ShareReportButton assessmentId={params.assessmentId} />
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <div className="rounded-3xl bg-gradient-to-br from-purple-500 to-blue-500 p-6 text-white md:col-span-2">
            <p className="text-sm uppercase">Overall level</p>
            <p className="text-5xl font-semibold">G{results.overallLevel}</p>
            <p className="mt-2 text-sm text-white/80">
              We&apos;ll adapt lessons, sensory supports, and pacing using this baseline.
            </p>
            <p className="mt-4 text-sm text-white/90">Learning profile: {results.learningProfile}</p>
          </div>
          {DOMAINS.map((domain) => (
            <CapabilityCard
              key={domain}
              domain={domain}
              level={results.domainLevels[domain]}
              summary={results.domainSummaries[domain]}
              responses={responseMap[domain]}
            />
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <NarrativeCard title="Strengths" items={results.strengths} accent="text-emerald-500" />
          <NarrativeCard title="Growth edges" items={results.challenges} accent="text-amber-500" />
          <LearningProfileCard profile={results.learningProfile} recommendations={priorityRecommendation} />
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Recommended next steps</h2>
          <p className="text-sm text-slate-500">Blend these into your next coaching plan.</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
            {results.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Response breakdown</h2>
          <p className="text-sm text-slate-500">Each dot represents a prompt at a specific difficulty. Purple = correct, slate = still practicing.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {DOMAINS.map((domain) => (
              <DomainResponseCard key={domain} domain={domain} responses={responseMap[domain]} />
            ))}
          </div>
        </section>

        <div className="flex justify-between gap-4 flex-wrap">
          <Link href="/learn/assessment" className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700">
            Re-run baseline
          </Link>
          <Link href="/dashboard" className="rounded-full bg-purple-500 px-6 py-3 font-semibold text-white">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function CapabilityCard({
  domain,
  level,
  summary,
  responses
}: {
  domain: AssessmentDomainName;
  level: number;
  summary: string;
  responses: DomainResponseEntry[];
}) {
  const accuracy = computeAccuracy(responses);
  const summaryText = summary || "Awaiting AI reflection.";
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{domain}</p>
          <p className="text-3xl font-semibold text-slate-900">G{level ?? "-"}</p>
        </div>
        {typeof accuracy === "number" && <p className="text-sm text-slate-500">{accuracy}% accurate</p>}
      </div>
      <p className="mt-3 text-sm text-slate-600">{summaryText}</p>
      <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
          style={{ width: `${Math.min(100, Math.max(0, ((level ?? 1) / 12) * 100))}%` }}
        />
      </div>
    </div>
  );
}

function NarrativeCard({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className={`text-sm font-semibold ${accent}`}>{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function LearningProfileCard({ profile, recommendations }: { profile: string; recommendations: string[] }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
      <p className="text-sm uppercase tracking-wide text-white/70">Learning profile</p>
      <p className="mt-2 text-lg leading-relaxed text-white/90">{profile}</p>
      <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm">
        <p className="text-xs uppercase text-white/70">Immediate focus</p>
        <ul className="mt-2 space-y-1 text-white/90">
          {recommendations.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DomainResponseCard({ domain, responses }: { domain: AssessmentDomainName; responses: DomainResponseEntry[] }) {
  if (!responses.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
        <p>{domain}</p>
        <p className="text-xs">No prompt history yet.</p>
      </div>
    );
  }

  const accuracy = computeAccuracy(responses);
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <p className="font-semibold text-slate-900">{domain}</p>
        {typeof accuracy === "number" && <p>{accuracy}% accurate</p>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {responses.map((entry) => (
          <span
            key={entry.id}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${entry.isCorrect ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-600"}`}
            title={`G${entry.difficulty} • ${entry.type}`}
          >
            G{entry.difficulty}
            <span>{entry.isCorrect ? "✔" : "…"}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function computeAccuracy(responses: DomainResponseEntry[]) {
  if (!responses.length) return null;
  const correct = responses.filter((item) => item.isCorrect).length;
  return Math.round((correct / responses.length) * 100);
}

function buildDomainResponseMap(results: AssessmentResults) {
  const base: Record<AssessmentDomainName, DomainResponseEntry[]> = {
    READING: [],
    MATH: [],
    SPEECH: [],
    SEL: [],
    SCIENCE: []
  };

  for (const question of results.questionLedger ?? []) {
    const mapEntry: DomainResponseEntry = {
      ...question,
      isCorrect: results.detailedResponses?.[question.id]?.isCorrect
    };
    base[question.domain]?.push(mapEntry);
  }
  return base;
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

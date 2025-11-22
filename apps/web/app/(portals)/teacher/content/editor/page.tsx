"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import clsx from "clsx";

type LearningStandard = {
  id: string;
  code: string;
  jurisdiction: string;
  subject: string;
  gradeBand: string;
  description?: string | null;
};

type ContentOverview = {
  id: string;
  title: string;
  summary?: string | null;
  status: string;
  contentType: string;
  standards?: LearningStandard[];
  versions?: Array<{
    id: string;
    versionNumber: number;
    status: string;
    source: string;
    publishedAt?: string | null;
    createdAt: string;
    diffSummary?: string | null;
  }>;
  effectiveness?: Array<{
    date: string;
    engagementScore: number;
    masteryDelta: number;
    aiQualityScore: number;
    educatorSentiment: number;
    sampleSize: number;
  }>;
};

type AdaptationResponse = {
  version: { id: string; versionNumber: number; status: string };
  adaptation: {
    content: string;
    summary: string;
    highlights: string[];
    modality: string;
    confidence: number;
  };
};

const CONTENT_TYPES = ["LESSON", "ACTIVITY", "ASSESSMENT", "SUPPORT", "RESOURCE"];
const MODALITIES = ["TEXT", "AUDIO", "VIDEO", "HAPTIC", "MULTIMODAL"];
const SCAFFOLDING = ["NONE", "LIGHT", "FULL"];

export default function TeacherContentEditorPage() {
  const { data: session } = useSession();
  const [standards, setStandards] = useState<LearningStandard[]>([]);
  const [standardsLoading, setStandardsLoading] = useState(false);
  const [standardFilters, setStandardFilters] = useState({ search: "", subject: "", gradeBand: "" });

  const [moduleId, setModuleId] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentSummary, setContentSummary] = useState("");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [currentContentId, setCurrentContentId] = useState("");
  const [contentIdInput, setContentIdInput] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [content, setContent] = useState<ContentOverview | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const [baseContent, setBaseContent] = useState("");
  const [modality, setModality] = useState(MODALITIES[0]);
  const [scaffolding, setScaffolding] = useState(SCAFFOLDING[1]);
  const [adaptation, setAdaptation] = useState<AdaptationResponse | null>(null);
  const [adapting, setAdapting] = useState(false);

  const selectedStandardObjects = useMemo(
    () => standards.filter((standard) => selectedStandards.includes(standard.id)),
    [standards, selectedStandards]
  );

  const fetchStandards = useCallback(async () => {
    setStandardsLoading(true);
    try {
      const params = new URLSearchParams();
      if (standardFilters.search) params.append("search", standardFilters.search);
      if (standardFilters.subject) params.append("subject", standardFilters.subject);
      if (standardFilters.gradeBand) params.append("gradeBand", standardFilters.gradeBand);
      params.append("limit", "50");
      const response = await fetch(`/api/curriculum/standards?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Unable to load standards");
      }
      const data = await response.json();
      setStandards(data.standards ?? []);
    } catch (error) {
      console.error(error);
      setServerMessage((error as Error).message);
    } finally {
      setStandardsLoading(false);
    }
  }, [standardFilters]);

  const loadContent = useCallback(
    async (contentId: string) => {
      if (!contentId) return;
      setLoadingContent(true);
      try {
        const params = new URLSearchParams({ versions: "true", standards: "true", effectiveness: "true" });
        const response = await fetch(`/api/curriculum/content/${contentId}?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Content not found");
        }
        const data = await response.json();
        setContent(data.content ?? null);
        setCurrentContentId(contentId);
        setContentIdInput(contentId);
        setServerMessage(null);
      } catch (error) {
        setServerMessage((error as Error).message);
      } finally {
        setLoadingContent(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchStandards();
  }, [fetchStandards]);

  const handleStandardToggle = (standardId: string) => {
    setSelectedStandards((prev) =>
      prev.includes(standardId) ? prev.filter((id) => id !== standardId) : [...prev, standardId]
    );
  };

  const handleCreateContent = async (event: FormEvent) => {
    event.preventDefault();
    setServerMessage(null);
    try {
      const response = await fetch("/api/curriculum/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          title: contentTitle,
          summary: contentSummary,
          contentType,
          standardIds: selectedStandards
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Unable to create content");
      }
  const data = await response.json();
      setServerMessage("Content shell created. Loading latest data...");
      setModuleId("");
      setContentTitle("");
      setContentSummary("");
      setSelectedStandards([]);
      void loadContent(data.content.id);
    } catch (error) {
      setServerMessage((error as Error).message);
    }
  };

  const handleAdapt = async () => {
    if (!currentContentId) {
      setServerMessage("Create or load content first.");
      return;
    }
    if (baseContent.trim().length < 10) {
      setServerMessage("Provide at least 10 characters of base content.");
      return;
    }
    setAdapting(true);
    setServerMessage(null);
    try {
      const response = await fetch(`/api/curriculum/content/${currentContentId}/adapt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseContent,
          audience: { modality, scaffolding }
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Adaptation failed");
      }
      const data = (await response.json()) as AdaptationResponse;
      setAdaptation(data);
      setServerMessage("Adaptation ready. Review before publishing.");
      setBaseContent("");
      void loadContent(currentContentId);
    } catch (error) {
      setServerMessage((error as Error).message);
    } finally {
      setAdapting(false);
    }
  };

  const handlePublish = async (versionId: string) => {
    if (!currentContentId) return;
    try {
      const response = await fetch(`/api/curriculum/content/${currentContentId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Publish failed");
      }
      setServerMessage("Version published.");
      void loadContent(currentContentId);
    } catch (error) {
      setServerMessage((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950/5">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row">
        <aside className="w-full rounded-3xl border border-white/10 bg-white/80 p-6 lg:w-80">
          <h2 className="text-base font-semibold text-slate-900">Standards Library</h2>
          <p className="text-sm text-slate-500">Filter and tag curriculum shells with regional references.</p>

          <div className="mt-4 space-y-3">
            <input
              value={standardFilters.search}
              onChange={(event) => setStandardFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Search codes or keywords"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <input
              value={standardFilters.subject}
              onChange={(event) => setStandardFilters((prev) => ({ ...prev, subject: event.target.value }))}
              placeholder="Subject"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <input
              value={standardFilters.gradeBand}
              onChange={(event) => setStandardFilters((prev) => ({ ...prev, gradeBand: event.target.value }))}
              placeholder="Grade band"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <button
              onClick={() => void fetchStandards()}
              className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-500"
              disabled={standardsLoading}
            >
              {standardsLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="mt-6 max-h-80 space-y-2 overflow-y-auto pr-1 text-sm">
            {standards.map((standard) => (
              <button
                key={standard.id}
                onClick={() => handleStandardToggle(standard.id)}
                className={clsx(
                  "w-full rounded-2xl border px-3 py-2 text-left",
                  selectedStandards.includes(standard.id)
                    ? "border-cyan-500 bg-cyan-50/80"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {standard.jurisdiction} • {standard.gradeBand}
                </p>
                <p className="text-sm font-medium text-slate-900">{standard.code}</p>
                <p className="text-xs text-slate-500">{standard.subject}</p>
              </button>
            ))}
            {!standards.length && !standardsLoading && (
              <p className="text-center text-xs text-slate-500">No standards match the filters.</p>
            )}
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-cyan-600">{session?.user?.name ?? "Teacher"}</p>
                <h1 className="text-2xl font-semibold text-slate-900">Curriculum Workbench</h1>
                <p className="text-sm text-slate-500">
                  Create shells, request AI adaptations, and review effectiveness signals in one place.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-right">
                <p className="text-xs text-slate-500">Active content</p>
                <p className="text-base font-semibold text-slate-900">{content ? content.title : "None loaded"}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                value={contentIdInput}
                onChange={(event) => setContentIdInput(event.target.value)}
                placeholder="Existing content ID"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void loadContent(contentIdInput)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
              >
                Load content
              </button>
            </div>

            {serverMessage && <p className="mt-4 rounded-2xl bg-slate-900/5 px-4 py-2 text-sm text-slate-700">{serverMessage}</p>}

            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateContent}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Module ID</label>
                <input
                  value={moduleId}
                  onChange={(event) => setModuleId(event.target.value)}
                  placeholder="module_123"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Content title</label>
                <input
                  value={contentTitle}
                  onChange={(event) => setContentTitle(event.target.value)}
                  placeholder="Sensory Reading Warmup"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Summary</label>
                <textarea
                  value={contentSummary}
                  onChange={(event) => setContentSummary(event.target.value)}
                  placeholder="Brief description for collaborators"
                  className="min-h-[80px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Content type</label>
                <select
                  value={contentType}
                  onChange={(event) => setContentType(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2"
                >
                  {CONTENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-3 md:justify-end">
                <button
                  type="submit"
                  className="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-cyan-600/40 hover:bg-cyan-500"
                >
                  Create shell
                </button>
                <button
                  type="button"
                  onClick={() => void loadContent(currentContentId)}
                  disabled={!currentContentId || loadingContent}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 disabled:border-slate-100 disabled:text-slate-300"
                >
                  Refresh content
                </button>
              </div>
            </form>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/70 p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-cyan-600">AI Assistant</p>
                  <h2 className="text-xl font-semibold text-slate-900">Adapt content instantly</h2>
                </div>
                <select
                  value={modality}
                  onChange={(event) => setModality(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {MODALITIES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              <textarea
                value={baseContent}
                onChange={(event) => setBaseContent(event.target.value)}
                placeholder="Paste lesson notes, sample question, or prompt for the AI assistant..."
                className="mt-4 min-h-[160px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />

              <div className="mt-3 flex flex-wrap gap-3">
                <select
                  value={scaffolding}
                  onChange={(event) => setScaffolding(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {SCAFFOLDING.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleAdapt()}
                  disabled={adapting}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-500"
                >
                  {adapting ? "Adapting..." : "Request adaptation"}
                </button>
              </div>

              {adaptation && (
                <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/80 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-medium text-slate-800">Confidence {(adaptation.adaptation.confidence * 100).toFixed(0)}%</p>
                    <button
                      onClick={() => handlePublish(adaptation.version.id)}
                      className="rounded-full border border-cyan-500 px-3 py-1 text-xs font-semibold text-cyan-700"
                    >
                      Publish version {adaptation.version.versionNumber}
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{adaptation.adaptation.summary}</p>
                  <article className="prose prose-sm mt-3 whitespace-pre-wrap text-slate-800">
                    {adaptation.adaptation.content}
                  </article>
                  <ul className="mt-3 list-disc pl-5 text-xs text-slate-600">
                    {adaptation.adaptation.highlights.map((highlight, index) => (
                      <li key={index}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/80 p-5">
                <h3 className="text-base font-semibold text-slate-900">Selected standards</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {selectedStandardObjects.length ? (
                    selectedStandardObjects.map((standard) => (
                      <li key={standard.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                        <p className="font-semibold text-slate-900">{standard.code}</p>
                        <p className="text-xs text-slate-500">
                          {standard.subject} • {standard.gradeBand}
                        </p>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No standards tagged yet.</p>
                  )}
                </ul>
              </div>

              <EffectivenessPanel content={content} loading={loadingContent} />
            </div>
          </section>

          {content?.versions && content.versions.length > 0 && (
            <section className="rounded-3xl border border-white/10 bg-white/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-cyan-600">Version history</p>
                  <h2 className="text-xl font-semibold text-slate-900">Latest drafts & releases</h2>
                </div>
                <p className="text-sm text-slate-500">Click publish to set the active version.</p>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {content.versions.map((version) => (
                  <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        v{version.versionNumber} • {version.source}
                      </p>
                      <p className="text-xs text-slate-500">{version.diffSummary ?? "No summary"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={clsx(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          version.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : version.status === "DRAFT"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-slate-200 text-slate-700"
                        )}
                      >
                        {version.status}
                      </span>
                      {version.status !== "ACTIVE" && (
                        <button
                          onClick={() => handlePublish(version.id)}
                          className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:border-slate-400"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function EffectivenessPanel({ content, loading }: { content: ContentOverview | null; loading: boolean }) {
  if (!content) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/80 p-5">
        <h3 className="text-base font-semibold text-slate-900">Content effectiveness</h3>
        <p className="text-sm text-slate-500">Load or create a content shell to view analytics.</p>
      </div>
    );
  }

  const latest = content.effectiveness?.[0];
  return (
    <div className="rounded-3xl border border-white/10 bg-white/80 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-cyan-600">Effectiveness</p>
          <h3 className="text-base font-semibold text-slate-900">Daily aggregates</h3>
        </div>
        {loading && <span className="text-xs text-slate-500">Refreshing…</span>}
      </div>
      {latest ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-900/5 px-3 py-2">
            <dt className="text-xs text-slate-500">Engagement</dt>
            <dd className="text-lg font-semibold text-slate-900">{(latest.engagementScore * 100).toFixed(0)}%</dd>
          </div>
          <div className="rounded-2xl bg-slate-900/5 px-3 py-2">
            <dt className="text-xs text-slate-500">Mastery delta</dt>
            <dd className="text-lg font-semibold text-slate-900">{latest.masteryDelta.toFixed(2)}</dd>
          </div>
          <div className="rounded-2xl bg-slate-900/5 px-3 py-2">
            <dt className="text-xs text-slate-500">AI quality</dt>
            <dd className="text-lg font-semibold text-slate-900">{(latest.aiQualityScore * 100).toFixed(0)}%</dd>
          </div>
          <div className="rounded-2xl bg-slate-900/5 px-3 py-2">
            <dt className="text-xs text-slate-500">Educator sentiment</dt>
            <dd className="text-lg font-semibold text-slate-900">{(latest.educatorSentiment * 100).toFixed(0)}%</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No interactions recorded yet. Deliver the lesson to start tracking.</p>
      )}
    </div>
  );
}

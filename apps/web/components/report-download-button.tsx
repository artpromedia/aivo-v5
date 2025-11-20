"use client";

import { useState } from "react";

export function ReportDownloadButton({ assessmentId }: { assessmentId: string }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      const response = await fetch(`/api/assessment/report/${assessmentId}`);
      if (!response.ok) {
        throw new Error("Unable to build report");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `baseline-report-${assessmentId}.md`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDownloading ? "Preparing report…" : "Download report"}
      {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
    </button>
  );
}

export function ShareReportButton({ assessmentId }: { assessmentId: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/learn/assessment/results/${assessmentId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Baseline capability map", url: shareUrl });
        return;
      } catch {
        // fall back to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-200"
    >
      {status === "copied" ? "Link copied" : status === "error" ? "Copy failed" : "Share link"}
    </button>
  );
}

'use client'

import { useState, type ReactNode } from "react";
import type { ApprovalRequest } from "@/lib/types/dashboard";

type ApprovalQueueProps = {
  approvals: ApprovalRequest[];
  onApprove: (approval: ApprovalRequest) => Promise<void> | void;
  onReject: (approval: ApprovalRequest) => Promise<void> | void;
};

export function ApprovalQueue({ approvals, onApprove, onReject }: ApprovalQueueProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!approvals?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        No pending approvals. AI will notify you when something needs attention.
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {approvals.map((approval) => {
        const isProcessing = processingId === approval.id;
        const detailMap = approval.details as Record<string, unknown> | undefined;
        const currentLevelValue = detailMap?.["currentLevel"];
        const recommendedLevelValue = detailMap?.["recommendedLevel"];
        const reasoningValue = detailMap?.["reasoning"];
        const currentLevel =
          typeof currentLevelValue === "number"
            ? currentLevelValue
            : typeof currentLevelValue === "string"
              ? currentLevelValue
              : "—";
        const recommendedLevel =
          typeof recommendedLevelValue === "number"
            ? recommendedLevelValue
            : typeof recommendedLevelValue === "string"
              ? recommendedLevelValue
              : "—";
        const reasoning = typeof reasoningValue === "string" ? reasoningValue : undefined;
        const showDifficultyChange = approval.type === "DIFFICULTY_CHANGE";
        return (
          <li key={approval.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{approval.learnerName}</p>
                <h4 className="text-base font-semibold text-slate-900">{approval.title}</h4>
                <p className="text-sm text-slate-600">{approval.summary}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Requested by {approval.requestedBy} · {new Date(approval.requestedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-2 text-sm font-semibold">
                <button
                  type="button"
                  disabled={isProcessing}
                  className="rounded-full bg-emerald-500/90 px-4 py-2 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  onClick={async () => {
                    setProcessingId(approval.id);
                    await onApprove(approval);
                    setProcessingId(null);
                  }}
                >
                  {isProcessing ? "Processing..." : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  className="rounded-full border border-rose-200 px-4 py-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed"
                  onClick={async () => {
                    setProcessingId(approval.id);
                    await onReject(approval);
                    setProcessingId(null);
                  }}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 transition hover:bg-slate-50"
                  onClick={() => setExpandedId((current) => (current === approval.id ? null : approval.id))}
                >
                  {expandedId === approval.id ? "Hide Details" : "View Details"}
                </button>
              </div>
            </div>
            {showDifficultyChange && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-3 font-semibold text-slate-700">
                  <span>Current Level: Grade {currentLevel}</span>
                  <span className="text-slate-400">→</span>
                  <span>Recommended: Grade {recommendedLevel}</span>
                </div>
                {reasoning && <p className="mt-2 text-xs text-slate-500">{reasoning}</p>}
              </div>
            )}
            {expandedId === approval.id && (
              <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                <DetailRow label="Requested">
                  {new Date(approval.createdAt).toLocaleString()}
                </DetailRow>
                <DetailRow label="Status">{approval.status}</DetailRow>
                <DetailRow label="Action">{approval.recommendedAction}</DetailRow>
                {detailMap && Object.keys(detailMap).length > 0 && (
                  <DetailRow label="Details">
                    <pre className="overflow-auto rounded bg-white/70 p-3 text-xs text-slate-500">
                      {JSON.stringify(detailMap, null, 2)}
                    </pre>
                  </DetailRow>
                )}
              </div>
            )}
            <p className="mt-3 text-xs font-semibold text-slate-700">AI notes: {approval.recommendedAction}</p>
          </li>
        );
      })}
    </ul>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div>{children}</div>
    </div>
  );
}

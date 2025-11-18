"use client";

import { useEffect, useState } from "react";
import { AivoApiClient } from "@aivo/api-client";
import type { LearnerSession, LessonPlan, SessionActivity, SubjectCode } from "@aivo/types";

const client = new AivoApiClient("http://localhost:4000");

export default function SessionPage() {
	const [session, setSession] = useState<LearnerSession | null>(null);
	const [me, setMe] = useState<ReturnType<typeof client.me> extends Promise<infer T> ? T | null : null>(null);
	const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
	const [loading, setLoading] = useState(false);
	const [starting, setStarting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showBreakMessage, setShowBreakMessage] = useState(false);
	const [updatingActivityId, setUpdatingActivityId] = useState<string | null>(null);

	function getPrimarySubject(learnerSubjects: string[] | undefined): SubjectCode {
		const fallback: SubjectCode = "math";
		if (!learnerSubjects || learnerSubjects.length === 0) return fallback;
		const raw = learnerSubjects[0];
		const allowed: SubjectCode[] = ["math", "ela"];
		return (allowed as string[]).includes(raw) ? (raw as SubjectCode) : fallback;
	}

	async function loadSession() {
		setLoading(true);
		setError(null);
		try {
			const meRes = await client.me();
			setMe(meRes);
			const learnerId = meRes.learner?.id ?? "demo-learner";
			const subject = getPrimarySubject(meRes.learner?.subjects);
			const res = await client.getTodaySession(learnerId, subject);
			setSession(res.session);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}

	async function handleStartSession() {
		setStarting(true);
		setError(null);
		try {
			const meRes = me ?? (await client.me());
			if (!me) setMe(meRes);
			const learnerId = meRes.learner?.id ?? "demo-learner";
			const subject = getPrimarySubject(meRes.learner?.subjects);
			const res = await client.startSession({
				learnerId,
				subject
			});
			setSession(res.session);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setStarting(false);
		}
	}

	async function updateActivityStatus(
		activity: SessionActivity,
		status: "in_progress" | "completed"
	) {
		if (!session) return;

		// When a micro-lesson starts, fetch a calm lesson plan.
		if (status === "in_progress" && activity.type === "micro_lesson") {
			setError(null);
			try {
				const meRes = me ?? (await client.me());
				if (!me) setMe(meRes);
				const learnerId = meRes.learner?.id ?? "demo-learner";
				const subject =
					meRes.learner?.subjects && meRes.learner.subjects.length > 0
						? getPrimarySubject(meRes.learner.subjects)
						: (activity.subject as SubjectCode);
				const region = meRes.learner?.region ?? "north_america";
				const { plan } = await client.generateLessonPlan({
					learnerId,
					subject,
					region
				});
				setLessonPlan(plan);
			} catch (e) {
				setError((e as Error).message);
			}
		}
		setUpdatingActivityId(activity.id);
		setError(null);
		try {
			const res = await client.updateActivityStatus({
				sessionId: session.id,
				activityId: activity.id,
				status
			});
			setSession(res.session);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setUpdatingActivityId(null);
		}
	}

	useEffect(() => {
		void loadSession();
	}, []);

	const todayLabel = new Date().toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		weekday: "short"
	});

	const subjectLabel = (me?.learner?.subjects?.[0] ?? "math").toUpperCase();

	return (
		<main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 p-6">
			<section className="w-full max-w-2xl rounded-2xl bg-slate-900/80 border border-slate-800 shadow-soft-coral p-5 space-y-4">
				<header className="flex items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-semibold">Today&apos;s Calm Session</h1>
						<p className="text-xs text-slate-300">
							{todayLabel} • Subject: <span className="font-medium uppercase">{subjectLabel}</span>
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowBreakMessage(true)}
						className="rounded-pill border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-slate-800/60 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
					>
						I need a break
					</button>
				</header>

				{showBreakMessage && (
					<div className="rounded-xl bg-emerald-500/10 border border-emerald-500/40 p-3 text-xs text-emerald-100">
						It&apos;s okay to pause. Take a breath, stretch, or get a drink of water. When you&apos;re
						ready, you can come back and continue—your session will wait for you.
						<button
							type="button"
							className="ml-2 underline underline-offset-2 text-emerald-200"
							onClick={() => setShowBreakMessage(false)}
						>
							Got it
						</button>
					</div>
				)}

				{loading && <p className="text-xs text-slate-400">Checking today&apos;s plan…</p>}
				{error && <p className="text-xs text-red-400">Error: {error}</p>}

				{!loading && !session && (
					<div className="space-y-3">
						<p className="text-sm text-slate-200">
							You don&apos;t have a session started yet. We&apos;ll create a short, gentle plan for
							today.
						</p>
						<button
							type="button"
							disabled={starting}
							onClick={handleStartSession}
							className="w-full rounded-pill bg-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
						>
							{starting ? "Preparing your calm session…" : "Start calm session"}
						</button>
					</div>
				)}

				{session && (
					<div className="space-y-4">
						<div className="flex justify-between items-center">
							<p className="text-xs text-slate-300">
								Planned time: {session.plannedMinutes} minutes • Status: {" "}
								<span className="font-semibold capitalize">{session.status}</span>
							</p>
						</div>
						<ul className="space-y-3">
							{session.activities.map((activity) => {
								const isCurrent =
									activity.status === "pending" || activity.status === "in_progress";

								const statusLabel =
									activity.status === "pending"
										? "Not started"
										: activity.status === "in_progress"
										? "In progress"
										: activity.status === "completed"
										? "Done"
										: "Skipped";

								return (
									<li
										key={activity.id}
										className={`rounded-xl border p-3 text-xs ${
											isCurrent
												? "bg-slate-800/80 border-slate-700"
												: "bg-slate-900/60 border-slate-800"
										}`}
									>
										<div className="flex justify-between items-start gap-3">
											<div>
												<p className="text-[11px] uppercase tracking-wide text-slate-400">
													{activity.type.replace("_", " ")}
												</p>
												<h2 className="text-sm font-semibold text-slate-50">
													{activity.title}
												</h2>
												<p className="mt-1 text-[11px] text-slate-300">
													{activity.instructions}
												</p>
											</div>
											<span
												className={`text-[10px] font-semibold rounded-pill px-2 py-0.5 ${
													activity.status === "completed"
														? "bg-emerald-500/20 text-emerald-300"
														: activity.status === "in_progress"
														? "bg-amber-500/20 text-amber-300"
														: activity.status === "skipped"
														? "bg-slate-600/40 text-slate-200"
														: "bg-slate-700/40 text-slate-200"
												}`}
											>
												{statusLabel}
											</span>
										</div>
										<div className="mt-2 flex justify-between items-center">
											<p className="text-[11px] text-slate-400">
												~{activity.estimatedMinutes} minutes
											</p>
											<div className="flex gap-2">
												{activity.status === "pending" && (
													<button
														type="button"
														disabled={updatingActivityId === activity.id}
														onClick={() => updateActivityStatus(activity, "in_progress")}
														className="rounded-pill border border-slate-600 px-3 py-1 text-[11px] text-slate-100 disabled:opacity-60"
													>
														{updatingActivityId === activity.id ? "Starting…" : "Start"}
													</button>
												)}
												{activity.status === "in_progress" && (
													<button
														type="button"
														disabled={updatingActivityId === activity.id}
														onClick={() => updateActivityStatus(activity, "completed")}
														className="rounded-pill bg-coral px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
													>
														{updatingActivityId === activity.id ? "Saving…" : "Mark done"}
													</button>
												)}
											</div>
										</div>
									</li>
								);
							})}
						</ul>

						{lessonPlan && (
							<div className="mt-4 rounded-xl bg-slate-900/80 border border-slate-700 p-3 space-y-2">
								<h2 className="text-sm font-semibold text-slate-50">
									{lessonPlan.title}
								</h2>
								<p className="text-[11px] text-slate-300">
									Objective: {lessonPlan.objective}
								</p>
								<ul className="mt-2 space-y-2">
									{lessonPlan.blocks.map((block) => (
										<li
											key={block.id}
											className="rounded-lg border border-slate-700 bg-slate-900/70 p-2"
										>
											<p className="text-[10px] uppercase tracking-wide text-slate-400">
												{block.type.replace("_", " ")}
											</p>
											<p className="text-xs font-semibold text-slate-50">
												{block.title}
											</p>
											<p className="mt-1 text-[11px] text-slate-300">
												{block.studentFacingText}
											</p>
											{block.example && (
												<p className="mt-1 text-[11px] text-slate-200">
													Example: {block.example}
												</p>
											)}
											{block.practiceQuestion && (
												<p className="mt-1 text-[11px] text-slate-200">
													Try: {block.practiceQuestion}
												</p>
											)}
											{typeof block.estimatedMinutes === "number" && (
												<p className="mt-1 text-[10px] text-slate-500">
													~{block.estimatedMinutes} min
												</p>
											)}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}
			</section>
		</main>
	);
}

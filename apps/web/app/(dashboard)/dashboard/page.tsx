import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGuardianRole } from "@/lib/roles";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const adminRoles = ["SUPER_ADMIN", "GLOBAL_ADMIN", "DISTRICT_ADMIN", "SCHOOL_ADMIN"];
  const learners = await prisma.learner.findMany({
    where:
      adminRoles.includes(session.user.role)
        ? {}
        : isGuardianRole(session.user.role)
          ? { guardianId: session.user.id }
          : { userId: session.user.id },
    include: { user: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const guardianApprovals = isGuardianRole(session.user.role)
    ? await prisma.approvalRequest.findMany({
        where: {
          type: "DIFFICULTY_CHANGE",
          status: "PENDING",
          learner: { guardianId: session.user.id }
        },
        include: {
          learner: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 4
      })
    : [];

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <section className="rounded-2xl bg-slate-900/80 p-6">
        <p className="text-sm text-slate-400">Signed in as</p>
        <h1 className="text-3xl font-semibold">{session.user.username}</h1>
        <p className="text-sm text-slate-400">Role: {session.user.role}</p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-300">Collaboration</p>
            <h2 className="text-2xl font-semibold text-slate-100">Launch the Communication Hub</h2>
            <p className="text-sm text-slate-400">
              Coordinate messaging, announcements, AI insights, and meeting schedules with families and teachers.
            </p>
          </div>
          <Link
            href="/dashboard/communication"
            className="inline-flex items-center justify-center rounded-full bg-blue-500 px-6 py-2 font-semibold text-slate-950"
          >
            Open hub
          </Link>
        </div>
      </section>

      {isGuardianRole(session.user.role) && (
        <section className="rounded-2xl bg-slate-900/80 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-coral">Learners</p>
              <h2 className="text-2xl font-semibold">Recently created accounts</h2>
            </div>
            <Link
              href="/learners/new"
              className="rounded-full bg-coral px-4 py-2 font-semibold text-slate-950"
            >
              Add learner
            </Link>
          </div>
          <ul className="mt-6 space-y-3">
            {learners.map((learner) => (
              <li
                key={learner.id}
                className="rounded border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm"
              >
                <div className="font-semibold">
                  {learner.firstName} {learner.lastName}
                </div>
                <div className="text-slate-400">
                  Username: {learner.user.username} · Grade {learner.gradeLevel}
                </div>
              </li>
            ))}
            {learners.length === 0 && (
              <p className="text-sm text-slate-400">No learners yet. Use the button above to create one.</p>
            )}
          </ul>
        </section>
      )}

      {isGuardianRole(session.user.role) && (
        <section className="rounded-2xl bg-slate-900/80 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-blue-300">
                Difficulty change requests
              </p>
              <h2 className="text-2xl font-semibold">Pending approvals</h2>
              <p className="text-sm text-slate-400 mt-1">
                Review these changes in the caregiver app or reply to the email notification.
              </p>
            </div>
            <span className="rounded-full bg-slate-800 px-4 py-1 text-sm font-semibold text-slate-100">
              {guardianApprovals.length}
            </span>
          </div>

          {guardianApprovals.length === 0 ? (
            <p className="mt-6 text-sm text-slate-400">
              You have no pending difficulty changes right now.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {guardianApprovals.map((request) => {
                const details = (request.details ?? {}) as Record<string, unknown>;
                const currentLevel = typeof details.currentLevel === "number" ? details.currentLevel : undefined;
                const recommendedLevel = typeof details.recommendedLevel === "number" ? details.recommendedLevel : undefined;
                const reasoning = typeof details.reasoning === "string" ? details.reasoning : "Awaiting summary";
                const createdAt = new Date(request.createdAt).toLocaleString();

                return (
                  <li
                    key={request.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {request.learner?.firstName} {request.learner?.lastName}
                        </p>
                        <p className="text-base font-semibold text-slate-50">
                          {currentLevel ?? "?"} → {recommendedLevel ?? "?"}
                        </p>
                        <p className="text-xs text-slate-300 mt-1">{reasoning}</p>
                      </div>
                      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
                        Pending
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <p>Requested on {createdAt}</p>
                      <p className="italic">Approve from caregiver hub</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

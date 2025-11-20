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

  const learners = await prisma.learner.findMany({
    where:
      session.user.role === "ADMIN"
        ? {}
        : isGuardianRole(session.user.role)
          ? { guardianId: session.user.id }
          : { userId: session.user.id },
    include: { user: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <section className="rounded-2xl bg-slate-900/80 p-6">
        <p className="text-sm text-slate-400">Signed in as</p>
        <h1 className="text-3xl font-semibold">{session.user.username}</h1>
        <p className="text-sm text-slate-400">Role: {session.user.role}</p>
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
    </main>
  );
}

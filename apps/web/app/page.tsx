import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="max-w-3xl space-y-6 rounded-2xl bg-slate-900/80 p-8 shadow-soft-coral">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-coral">AIVO Agentic AI Learning Platform</p>
          <h1 className="text-4xl font-bold">Calm, adaptive AI learning for neurodiverse minds.</h1>
          <p className="text-slate-200">
            Parents, teachers, and learners can now share one secure workspace powered by NextAuth,
            Prisma, and Postgres. Self-register as a caregiver, invite learners, and let AIVO handle
            role-aware permissions and auditing automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/register"
            className="rounded-full bg-coral px-6 py-3 font-semibold text-slate-900 transition hover:bg-coral/90"
          >
            Create caregiver account
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-600 px-6 py-3 font-semibold text-slate-50 transition hover:border-coral hover:text-coral"
          >
            Log in
          </Link>
        </div>
      </section>
    </main>
  );
}

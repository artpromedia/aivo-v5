import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AACMainPage from "./AACMainPage";

interface PageProps {
  params: { learnerId: string };
}

export default async function Page({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const learner = await prisma.learner.findUnique({
    where: { id: params.learnerId },
    select: { 
      id: true,
      firstName: true, 
      lastName: true,
    }
  });

  if (!learner) {
    notFound();
  }

  const learnerName = `${learner.firstName} ${learner.lastName}`.trim();

  // Check if AAC system exists (temporary until Prisma client is regenerated)
  let hasAACSystem = false;
  try {
    const aacSystem = await (prisma as any).aACSystem?.findUnique({
      where: { learnerId: params.learnerId },
    });
    hasAACSystem = !!aacSystem;
  } catch {
    // Model may not exist yet
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/teacher/dashboard" className="text-blue-600 hover:underline">
          Teacher dashboard
        </Link>
        <span className="px-2">/</span>
        <Link href="/teacher/learners" className="text-blue-600 hover:underline">
          Learners
        </Link>
        <span className="px-2">/</span>
        <span className="text-slate-900">{learnerName}</span>
        <span className="px-2">/</span>
        <span className="text-slate-900 font-semibold">AAC</span>
      </nav>

      <header className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-slate-400">AAC Communication System</p>
        <h1 className="text-2xl font-semibold text-slate-900">{learnerName}</h1>
        <p className="text-sm text-slate-500">
          Manage communication boards, track vocabulary goals, and view usage analytics.
        </p>
      </header>

      <AACMainPage 
        learnerId={params.learnerId} 
        learnerName={learnerName}
        hasAACSystem={hasAACSystem}
      />
    </div>
  );
}

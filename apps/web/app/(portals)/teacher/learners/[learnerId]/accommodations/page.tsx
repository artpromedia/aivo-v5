import Link from "next/link";
import { notFound } from "next/navigation";
import { AccommodationSettings } from "@/components/accommodations/AccommodationSettings";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    select: { firstName: true, lastName: true }
  });

  if (!learner) {
    notFound();
  }

  const learnerName = `${learner.firstName} ${learner.lastName}`.trim();

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/portals/teacher/dashboard" className="text-blue-600 hover:underline">
          Teacher dashboard
        </Link>
        <span className="px-2">/</span>
        <Link href="/portals/teacher/learners" className="text-blue-600 hover:underline">
          Learners
        </Link>
        <span className="px-2">/</span>
        <span className="text-slate-900">{learnerName}</span>
        <span className="px-2">/</span>
        <span className="text-slate-900 font-semibold">Accommodations</span>
      </nav>

      <header className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-slate-400">Accommodations</p>
        <h1 className="text-2xl font-semibold text-slate-900">{learnerName}</h1>
        <p className="text-sm text-slate-500">Toggle supports, share notes, and review effectiveness analytics.</p>
      </header>

      <AccommodationSettings learnerId={params.learnerId} />
    </div>
  );
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accommodationManager } from "@/lib/accommodations/accommodation-manager";

const setupSchema = z.object({
  diagnoses: z.array(z.string().min(2)).max(20).optional()
});

export async function POST(request: Request, { params }: { params: { learnerId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as unknown;
  const parsed = setupSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const learner = await prisma.learner.findUnique({
    where: { id: params.learnerId },
    include: { diagnoses: true }
  });

  if (!learner) {
    return NextResponse.json({ error: "Learner not found" }, { status: 404 });
  }

  const inferredDiagnoses = learner.diagnoses
    .map((diagnosis) => diagnosis.description?.trim())
    .filter((description): description is string => Boolean(description));

  const diagnoses = parsed.data.diagnoses ?? inferredDiagnoses;

  if (!diagnoses.length) {
    return NextResponse.json({ error: "No diagnoses available for auto accommodations" }, { status: 400 });
  }

  const accommodations = await accommodationManager.setupAccommodations(params.learnerId, diagnoses);

  return NextResponse.json({ accommodations });
}

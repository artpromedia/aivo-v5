import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Accommodation } from "@/lib/accommodations/accommodation-manager";

const updateSchema = z.object({
  accommodations: z.array(z.nativeEnum(Accommodation)).max(32),
  notes: z.string().max(500).optional()
});

export async function GET(_: Request, { params }: { params: { learnerId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await prisma.learnerAccommodation.findUnique({
    where: { learnerId: params.learnerId }
  });

  return NextResponse.json({ plan });
}

export async function PATCH(request: Request, { params }: { params: { learnerId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { accommodations, notes } = parsed.data;

  const plan = await prisma.learnerAccommodation.upsert({
    where: { learnerId: params.learnerId },
    create: {
      learnerId: params.learnerId,
      accommodations,
      autoEnabled: false,
      notes,
      metadata: { updatedBy: session.user.id }
    },
    update: {
      accommodations,
      autoEnabled: false,
      notes,
      metadata: { updatedBy: session.user.id, updatedAt: new Date().toISOString() }
    }
  });

  return NextResponse.json({ plan });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCommunicationHubInstance } from "@/lib/communication";

const requestSchema = z.object({
  learnerId: z.string(),
  topic: z.string().min(3)
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const learnerId = url.searchParams.get("learnerId");

  const insights = await prisma.aIInsight.findMany({
    where: {
      generatedForId: session.user.id,
      learnerId: learnerId ?? undefined
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return NextResponse.json({ insights });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const hub = getCommunicationHubInstance();
  if (!hub) {
    return NextResponse.json({ error: "Socket hub not initialized" }, { status: 503 });
  }

  await hub.generateAndSendInsight({
    learnerId: parsed.data.learnerId,
    topic: parsed.data.topic,
    requesterId: session.user.id
  });

  return NextResponse.json({ status: "queued" });
}

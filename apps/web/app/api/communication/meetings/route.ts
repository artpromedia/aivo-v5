import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCommunicationHubInstance } from "@/lib/communication";

const scheduleSchema = z.object({
  participants: z.array(z.string().min(1)).min(1),
  topic: z.string().min(3),
  scheduledTime: z.string().datetime(),
  duration: z.number().optional()
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meetings = await prisma.meeting.findMany({
    where: {
      OR: [{ createdById: session.user.id }, { participants: { some: { userId: session.user.id } } }]
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, username: true } }
        }
      }
    },
    orderBy: { scheduledTime: "desc" },
    take: 20
  });

  return NextResponse.json({ meetings });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = scheduleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const hub = getCommunicationHubInstance();
  if (!hub) {
    return NextResponse.json({ error: "Socket hub not initialized" }, { status: 503 });
  }

  await hub.scheduleVideoCall({
    ...parsed.data,
    createdBy: session.user.id
  });

  return NextResponse.json({ status: "scheduled" });
}

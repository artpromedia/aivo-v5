import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCommunicationHubInstance } from "@/lib/communication";

const payloadSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(5),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  recipients: z.array(z.string().min(1)).min(1)
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [{ recipients: { has: session.user.id } }, { recipients: { isEmpty: true } }]
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["ADMIN", "TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const hub = getCommunicationHubInstance();
  if (hub) {
    const announcement = await hub.sendAnnouncement({
      ...parsed.data,
      createdBy: session.user.id
    });
    return NextResponse.json({ announcement });
  }

  const announcement = await prisma.announcement.create({
    data: {
      ...parsed.data,
      createdById: session.user.id
    }
  });

  return NextResponse.json({ announcement });
}

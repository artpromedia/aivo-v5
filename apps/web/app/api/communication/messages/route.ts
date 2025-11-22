import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sendMessageSchema = z.object({
  to: z.string(),
  learnerId: z.string().optional(),
  message: z.string().min(1),
  type: z.enum(["TEXT", "CONCERN", "QUESTION", "ALERT", "SYSTEM"]).optional(),
  metadata: z.record(z.unknown()).optional()
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const withUser = url.searchParams.get("withUser");
  const learnerId = url.searchParams.get("learnerId");
  const limit = Number(url.searchParams.get("limit")) || 100;

  if (!withUser) {
    return NextResponse.json({ error: "Missing withUser parameter" }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: {
      learnerId: learnerId ?? undefined,
      OR: [
        { fromId: session.user.id, toId: withUser },
        { fromId: withUser, toId: session.user.id }
      ]
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      fromUser: { select: { id: true, username: true, role: true } }
    }
  });

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = sendMessageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  const message = await prisma.message.create({
    data: {
      fromId: session.user.id,
      toId: payload.to,
      learnerId: payload.learnerId,
      type: payload.type ?? "TEXT",
      content: payload.message,
      metadata: payload.metadata as Prisma.InputJsonValue
    },
    include: {
      fromUser: { select: { id: true, username: true, role: true } }
    }
  });

  await prisma.communicationLog.create({
    data: {
      userId: session.user.id,
      learnerId: payload.learnerId,
      type: "MESSAGE",
      channel: "api",
      payload: message as unknown as Prisma.InputJsonValue
    }
  });

  return NextResponse.json({ message });
}

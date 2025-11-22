import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ fromId: session.user.id }, { toId: session.user.id }]
    },
    include: {
      fromUser: { select: { id: true, username: true, role: true } },
      toUser: { select: { id: true, username: true, role: true } },
      learner: { select: { id: true, firstName: true, lastName: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  type ConversationEntry = {
    id: string;
    userId: string;
    name: string;
    role: string;
    learnerId?: string | null;
    learnerName?: string;
    avatar: string | null;
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
  };

  const map = new Map<string, ConversationEntry>();
  for (const message of messages) {
    const otherUser = message.fromId === session.user.id ? message.toUser : message.fromUser;
    if (!otherUser) continue;
    const key = `${otherUser.id}-${message.learnerId ?? "all"}`;
    if (!map.has(key)) {
      const unreadCount = messages.filter(
        (m: (typeof messages)[number]) =>
          m.fromId === otherUser.id && !m.readAt && m.toId === session.user.id
      ).length;
      map.set(key, {
        id: key,
        userId: otherUser.id,
        name: otherUser.username,
        role: otherUser.role,
        learnerId: message.learnerId,
        learnerName: message.learner
          ? `${message.learner.firstName} ${message.learner.lastName}`
          : undefined,
        avatar: null,
        lastMessage: message.content,
        lastMessageTime: message.createdAt,
        unreadCount
      });
    }
  }

  return NextResponse.json({ conversations: Array.from(map.values()) });
}

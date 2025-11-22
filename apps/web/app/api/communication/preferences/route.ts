import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  channels: z.object({
    email: z.boolean().default(true),
    inApp: z.boolean().default(true),
    sms: z.boolean().optional()
  }),
  digestFrequency: z.enum(["INSTANT", "DAILY", "WEEKLY"]).default("INSTANT"),
  muteUntil: z.string().datetime().optional()
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preference = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id }
  });

  return NextResponse.json({ preference });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { channels, digestFrequency, muteUntil } = parsed.data;

  const preference = await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    update: {
      channels,
      digestFrequency,
      muteUntil: muteUntil ? new Date(muteUntil) : null
    },
    create: {
      userId: session.user.id,
      channels,
      digestFrequency,
      muteUntil: muteUntil ? new Date(muteUntil) : null
    }
  });

  return NextResponse.json({ preference });
}

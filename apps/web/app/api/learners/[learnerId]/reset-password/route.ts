import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateStrongPassword, hashPassword } from "@/lib/passwords";
import { isGuardianRole } from "@/lib/roles";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: { learnerId: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGuardianRole(session.user.role)) {
    return NextResponse.json({ error: "Only caregivers can reset passwords" }, { status: 403 });
  }

  const learner = await prisma.learner.findFirst({
    where: { id: params.learnerId, guardianId: session.user.id },
    include: { user: true }
  });

  if (!learner) {
    return NextResponse.json({ error: "Learner not found" }, { status: 404 });
  }

  const newPassword = generateStrongPassword();
  const hashed = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: learner.userId },
    data: { password: hashed }
  });

  return NextResponse.json({
    learnerId: learner.id,
    username: learner.user.username,
    password: newPassword
  });
}

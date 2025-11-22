import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildBaseUsername, generateStrongPassword, hashPassword, resolveUniqueUsername } from "@/lib/passwords";
import { isGuardianRole } from "@/lib/roles";

export const runtime = "nodejs";

const learnerSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  dateOfBirth: z.string().transform((value) => new Date(value)),
  gradeLevel: z.coerce.number().int().min(0).max(12),
  actualLevel: z.coerce.number().int().min(0).max(12).optional()
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const learners = await prisma.learner.findMany({
    where: guardianFilter(session.user),
    include: {
      user: {
        select: { username: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(
    learners.map((learner) => ({
      id: learner.id,
      firstName: learner.firstName,
      lastName: learner.lastName,
      gradeLevel: learner.gradeLevel,
      actualLevel: learner.actualLevel,
      username: learner.user.username
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGuardianRole(session.user.role)) {
    return NextResponse.json({ error: "Only caregivers can create learners" }, { status: 403 });
  }

  try {
    const json = await request.json();
    const parsed = learnerSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { firstName, lastName, dateOfBirth, gradeLevel, actualLevel } = parsed.data;

    if (Number.isNaN(dateOfBirth.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const usernameBase = buildBaseUsername(firstName, lastName);
    const username = await resolveUniqueUsername(usernameBase, async (candidate) => {
      const existingUser = await prisma.user.findUnique({ where: { username: candidate } });
      return Boolean(existingUser);
    });

    const rawPassword = generateStrongPassword();
    const hashedPassword = await hashPassword(rawPassword);

    const learnerUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: Role.LEARNER
      }
    });

    const learner = await prisma.learner.create({
      data: {
        userId: learnerUser.id,
        guardianId: session.user.id,
        firstName,
        lastName,
        dateOfBirth,
        gradeLevel,
        actualLevel: actualLevel ?? null
      }
    });

    return NextResponse.json(
      {
        learnerId: learner.id,
        username,
        password: rawPassword
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create learner", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

function guardianFilter(user: { id: string; role: Role }): Prisma.LearnerWhereInput {
  if (user.role === Role.ADMIN) {
    return {};
  }

  if (isGuardianRole(user.role)) {
    return { guardianId: user.id };
  }

  return { userId: user.id };
}

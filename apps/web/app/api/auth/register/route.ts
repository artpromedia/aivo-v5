import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildBaseUsername, hashPassword, resolveUniqueUsername } from "@/lib/passwords";
import { isGuardianRole } from "@/lib/roles";

export const runtime = "nodejs";

const registerSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(/(?=.*[a-z])/, "Must include a lowercase letter")
    .regex(/(?=.*[A-Z])/, "Must include an uppercase letter")
    .regex(/(?=.*\d)/, "Must include a number")
    .regex(/(?=.*[@$!%*?&])/, "Must include a special character"),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  phone: z.string().optional(),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: "Role must be parent or teacher" })
  })
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, phone, role } = parsed.data;

    if (!isGuardianRole(role)) {
      return NextResponse.json({ error: "Only parents or teachers can register" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username: email }] } });
    if (existing) {
      return NextResponse.json({ error: "Account already exists" }, { status: 409 });
    }

    const usernameBase = buildBaseUsername(firstName, lastName);
    const username = await resolveUniqueUsername(usernameBase, async (candidate) => {
      const found = await prisma.user.findUnique({ where: { username: candidate } });
      return Boolean(found);
    });

    const hashedPassword = await hashPassword(password);

    const created = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role,
        profile: {
          create: {
            firstName,
            lastName,
            phone: phone ?? null
          }
        }
      },
      include: { profile: true }
    });

    return NextResponse.json({
      userId: created.id,
      username: created.username,
      email: created.email,
      role: created.role,
      profile: created.profile
    });
  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

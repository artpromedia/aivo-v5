import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildBaseUsername, hashPassword, resolveUniqueUsername } from "@/lib/passwords";
import { isGuardianRole } from "@/lib/roles";
import { applyRateLimit, addRateLimitHeaders, getClientIp } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";

const TRIAL_DURATION_DAYS = 30;

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

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (auth tier: 10 requests per 15 minutes per IP)
    const { response: rateLimitResponse, result: rateLimitResult } = await applyRateLimit(
      request,
      { tier: 'auth', identifier: `ip:${getClientIp(request)}` }
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

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

    // Check if email has been used for a trial before
    const usedTrialEmail = await prisma.trialUsedEmail.findUnique({
      where: { email },
    });

    const usernameBase = buildBaseUsername(firstName, lastName);
    const username = await resolveUniqueUsername(usernameBase, async (candidate) => {
      const found = await prisma.user.findUnique({ where: { username: candidate } });
      return Boolean(found);
    });

    const hashedPassword = await hashPassword(password);

    // Calculate trial dates (only if email hasn't been used for trial before)
    const canStartTrial = !usedTrialEmail;
    const trialStartedAt = canStartTrial ? new Date() : null;
    const trialEndsAt = canStartTrial ? new Date() : null;
    if (trialEndsAt) {
      trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);
    }

    const created = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role,
        // Automatically start trial for new users (if eligible)
        subscriptionStatus: canStartTrial ? "TRIAL_ACTIVE" : "NONE",
        subscriptionTier: canStartTrial ? "PRO" : "FREE", // Full access during trial
        trialStartedAt,
        trialEndsAt,
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

    const response = NextResponse.json({
      userId: created.id,
      username: created.username,
      email: created.email,
      role: created.role,
      profile: created.profile,
      // Include trial info in response
      trial: {
        started: canStartTrial,
        trialEndsAt: canStartTrial ? trialEndsAt : null,
        daysRemaining: canStartTrial ? TRIAL_DURATION_DAYS : 0,
        cannotStartTrialReason: !canStartTrial 
          ? "This email has already been used for a trial"
          : null,
      },
    });
    
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

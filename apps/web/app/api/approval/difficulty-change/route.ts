import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role, type Prisma, type ApprovalStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import type { PersonalizedModelConfig } from "@/lib/types/models";
import { isGuardianRole } from "@/lib/roles";
import { logError, logInfo, logWarn, recordMetricPoint } from "@/lib/observability";

const createSchema = z.object({
  learnerId: z.string(),
  currentLevel: z.number(),
  recommendedLevel: z.number(),
  reasoning: z.string(),
  performanceData: z.record(z.any())
});

const decisionSchema = z.object({
  requestId: z.string(),
  decision: z.enum(["APPROVED", "DECLINED"]),
  comments: z.string().optional()
});

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  const session = await auth();
  if (!session?.user?.id) {
    logWarn("Difficulty change creation unauthorized", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseContext = { userId: session.user.id, requestId };

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    logWarn("Difficulty change creation payload invalid", baseContext, { issues: parsed.error.flatten() });
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { learnerId, currentLevel, recommendedLevel, reasoning, performanceData } = parsed.data;
  const context = { ...baseContext, learnerId };

  try {
    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      select: { guardianId: true }
    });

    if (!learner) {
      logWarn("Difficulty change learner missing", context, { learnerId });
      return NextResponse.json({ error: "Learner not found" }, { status: 404 });
    }

    const learnerName =
      typeof performanceData?.learnerName === "string" && performanceData.learnerName.length
        ? performanceData.learnerName
        : "the learner";

    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        type: "DIFFICULTY_CHANGE",
        learnerId,
        requesterId: "AI_SYSTEM",
        approverId: learner.guardianId,
        status: "PENDING",
        details: {
          currentLevel,
          recommendedLevel,
          reasoning,
          performanceData
        }
      }
    });

    await sendNotification({
      userId: session.user.id,
      learnerId,
      to: session.user.email ?? undefined,
      subject: "Learning Level Adjustment Recommended",
      template: "difficulty-change-request",
      channel: "EMAIL",
      data: {
        learnerId,
        learnerName,
        currentLevel,
        recommendedLevel,
        reasoning,
        approvalLink: `/approve/${approvalRequest.id}`
      }
    });

    logInfo("Difficulty change approval queued", context, { approvalRequestId: approvalRequest.id });
    recordMetricPoint("approval.difficulty_change.created", 1, context, { status: "PENDING" });
    return NextResponse.json({ requestId: approvalRequest.id, status: "PENDING_APPROVAL" });
  } catch (error) {
    logError("Difficulty change creation failed", context, {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: "Unable to submit approval request" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  const session = await auth();
  if (!session?.user?.id) {
    logWarn("Difficulty change decision unauthorized", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseContext = { userId: session.user.id, requestId };

  const parsed = decisionSchema.safeParse(await request.json());
  if (!parsed.success) {
    logWarn("Difficulty change decision payload invalid", baseContext, { issues: parsed.error.flatten() });
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { requestId: approvalId, decision, comments } = parsed.data;
  const decisionStatus = decision as ApprovalStatus;

  try {
    const approvalRequest = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: { learner: true }
    });

    if (!approvalRequest) {
      logWarn("Difficulty change decision missing request", baseContext, { approvalId });
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    const context = { ...baseContext, learnerId: approvalRequest.learnerId };

    const canGuardianAct =
      isGuardianRole(session.user.role) && approvalRequest.learner?.guardianId === session.user.id;
    const canAct =
      approvalRequest.approverId === session.user.id || canGuardianAct || session.user.role === Role.ADMIN;

    if (!canAct) {
      logWarn("Difficulty change decision unauthorized", context, {
        approverId: approvalRequest.approverId,
        userId: session.user.id
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (decision === "APPROVED") {
      const details = (approvalRequest.details ?? {}) as Record<string, unknown>;
      const recommendedLevel = typeof details.recommendedLevel === "number" ? details.recommendedLevel : undefined;
      const currentLevel = typeof details.currentLevel === "number" ? details.currentLevel : undefined;
      const reasoningDetail = typeof details.reasoning === "string" ? details.reasoning : undefined;
      const personalizedModel = await prisma.personalizedModel.findUnique({
        where: { learnerId: approvalRequest.learnerId }
      });

      const config = (personalizedModel?.configuration ?? {}) as unknown as PersonalizedModelConfig;
      const updatedConfig: PersonalizedModelConfig = {
        ...config,
        actualLevel: recommendedLevel ?? config.actualLevel,
        gradeLevel: config.gradeLevel ?? recommendedLevel ?? config.actualLevel,
        domainLevels: {
          ...(config.domainLevels ?? {}),
          overall: recommendedLevel ?? config.actualLevel
        },
        learningStyle: config.learningStyle ?? "MIXED",
        adaptationRules: config.adaptationRules ?? {}
      };

      const configJson = updatedConfig as unknown as Prisma.JsonObject;

      await prisma.personalizedModel.upsert({
        where: { learnerId: approvalRequest.learnerId },
        update: {
          configuration: configJson,
          status: personalizedModel?.status ?? "ACTIVE"
        },
        create: {
          learnerId: approvalRequest.learnerId,
          configuration: configJson,
          status: "ACTIVE",
          summary: "Auto-created via approval system"
        }
      });

      await prisma.learningAdjustmentLog.create({
        data: {
          learnerId: approvalRequest.learnerId,
          previousLevel: currentLevel ?? updatedConfig.actualLevel,
          newLevel: recommendedLevel ?? updatedConfig.actualLevel,
          approvedBy: session.user.id,
          approvedAt: new Date(),
          reasoning: reasoningDetail ?? comments ?? null
        }
      });
    }

    await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: decisionStatus,
        comments,
        decidedAt: new Date()
      }
    });

    logInfo("Difficulty change decision recorded", context, { decision });
    recordMetricPoint("approval.difficulty_change.decisions", 1, context, { decision });
    return NextResponse.json({
      success: true,
      decision: decisionStatus,
      message: decisionStatus === "APPROVED" ? "Learning level has been adjusted" : "Adjustment request declined"
    });
  } catch (error) {
    logError("Difficulty change decision failed", baseContext, {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: "Unable to update approval" }, { status: 500 });
  }
}

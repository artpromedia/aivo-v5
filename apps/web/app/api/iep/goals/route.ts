import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoalStatus, Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get("learnerId");

  if (!learnerId) {
    return NextResponse.json({ error: "learnerId is required" }, { status: 400 });
  }

  try {
    const goals = await prisma.iEPGoal.findMany({
      where: { learnerId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load goals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<{
      learnerId: string;
      goal: string;
      category: string;
      targetDate: string;
      notes?: string;
      status?: GoalStatus;
    }>;

    const { learnerId, goal, category, targetDate, notes, status } = payload;

    if (!learnerId || !goal || !category || !targetDate) {
      return NextResponse.json({ error: "learnerId, goal, category, and targetDate are required" }, { status: 400 });
    }

    const parsedDate = new Date(targetDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "targetDate must be a valid date" }, { status: 400 });
    }

    const nextStatus = isGoalStatus(status) ? status : undefined;

    const goalData: Prisma.IEPGoalUncheckedCreateInput = {
      learnerId,
      goal,
      category,
      targetDate: parsedDate,
      notes
    };

    if (nextStatus) {
      goalData.status = nextStatus;
    }

    const createdGoal = await prisma.iEPGoal.create({
      data: goalData
    });

    return NextResponse.json({ goal: createdGoal }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create goal" }, { status: 500 });
  }
}

function isGoalStatus(value?: string | GoalStatus): value is GoalStatus {
  if (!value) return false;
  return Object.values(GoalStatus).includes(value as GoalStatus);
}

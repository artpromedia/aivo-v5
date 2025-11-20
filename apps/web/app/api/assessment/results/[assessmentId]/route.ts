import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { assessmentId: string } }) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.assessmentId }
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error("Failed to fetch assessment", error);
    return NextResponse.json({ error: "Unable to fetch assessment" }, { status: 500 });
  }
}

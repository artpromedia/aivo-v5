import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGuardianLearners } from "@/lib/dashboard/service";
import { logError, logInfo, logWarn } from "@/lib/observability";

export async function GET() {
  const requestId = randomUUID();
  const session = await auth();
  if (!session?.user?.id) {
    logWarn("Parent dashboard request unauthorized", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = { userId: session.user.id, requestId };

  try {
    const learners = await getGuardianLearners(session.user.id);
    logInfo("Parent dashboard served", context, { learnerCount: learners.length });
    return NextResponse.json({ learners });
  } catch (error) {
    logError("Parent dashboard failed", context, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Unable to load parent dashboard" }, { status: 500 });
  }
}

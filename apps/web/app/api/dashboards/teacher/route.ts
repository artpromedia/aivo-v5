import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTeacherDashboard } from "@/lib/dashboard/service";
import { logError, logInfo, logWarn } from "@/lib/observability";

export async function GET() {
  const requestId = randomUUID();
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    logWarn("Teacher dashboard request unauthorized", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = { userId: session.user.id, requestId };

  try {
    const dashboard = await getTeacherDashboard(session.user.id, session.user.role);
    logInfo("Teacher dashboard served", context, { metrics: dashboard.metrics.length });
    return NextResponse.json({ dashboard });
  } catch (error) {
    logError("Teacher dashboard failed", context, {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

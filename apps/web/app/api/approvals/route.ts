import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getApprovalsForUser } from "@/lib/dashboard/service";
import { logError, logInfo, logWarn } from "@/lib/observability";

export async function GET() {
  const requestId = randomUUID();
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    logWarn("Approvals request unauthorized", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = { userId: session.user.id, requestId };

  try {
    const approvals = await getApprovalsForUser(session.user.id, session.user.role);
    logInfo("Approvals payload served", context, { approvalCount: approvals.length });
    return NextResponse.json({ approvals });
  } catch (error) {
    logError("Approvals request failed", context, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Unable to load approvals" }, { status: 500 });
  }
}

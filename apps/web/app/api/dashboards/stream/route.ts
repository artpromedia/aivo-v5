import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getApprovalsForUser, getGuardianLearners, getTeacherDashboard } from "@/lib/dashboard/service";
import { logError, logInfo, logWarn, recordMetricPoint } from "@/lib/observability";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    logWarn("Dashboard stream unauthorized", { requestId: request.headers.get("x-request-id") ?? undefined });
    return new Response("Unauthorized", { status: 401 });
  }

  const scope = request.nextUrl.searchParams.get("scope") === "teacher" ? "teacher" : "parent";
  const userId = session.user.id;
  const role = session.user.role;
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  const context = { userId, requestId };
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      logInfo("Dashboard stream connected", context, { scope });
      async function push(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        recordMetricPoint("dashboard.stream.event", 1, context, { scope, event });
      }

      async function publish() {
        if (scope === "parent") {
          const learners = await getGuardianLearners(userId);
          await push("parent-update", { learners });
        } else {
          try {
            const dashboard = await getTeacherDashboard(userId, role);
            await push("teacher-update", { dashboard });
          } catch (error) {
            logWarn("Teacher dashboard stream unavailable", context, {
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }

        const approvals = await getApprovalsForUser(userId, role);
        await push("approvals-update", { approvals });
        logInfo("Dashboard stream payload published", context, {
          scope,
          approvals: approvals.length
        });
      }

      await publish();
      const interval = setInterval(() => {
        publish().catch((error) => {
          logError("Dashboard stream publish failed", context, {
            error: error instanceof Error ? error.message : String(error),
            scope
          });
        });
      }, 15000);

      const close = () => {
        clearInterval(interval);
        controller.close();
        logInfo("Dashboard stream disconnected", context, { scope });
      };

      request.signal.addEventListener("abort", close);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}

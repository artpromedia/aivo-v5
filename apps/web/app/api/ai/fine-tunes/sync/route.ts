import { NextResponse } from "next/server";
import { syncFineTuneStatuses } from "@/lib/ai/fine-tune-monitor";

function isAuthorized(request: Request) {
  const secret = process.env.AIVO_CRON_SECRET;
  if (!secret) {
    return true;
  }
  const header = request.headers.get("x-cron-secret") ?? "";
  return header === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncFineTuneStatuses();
  return NextResponse.json(result);
}

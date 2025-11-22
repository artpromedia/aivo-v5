import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { curriculumManager } from "@/lib/curriculum/curriculum-manager";

export async function GET(request: Request, { params }: { params: { contentId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const includeVersions = parseBoolean(url.searchParams.get("versions"));
  const includeStandards = parseBoolean(url.searchParams.get("standards"));
  const includeEffectiveness = parseBoolean(url.searchParams.get("effectiveness"));

  const overview = await curriculumManager.getContentOverview({
    contentId: params.contentId,
    includeVersions,
    includeStandards,
    includeEffectiveness
  });

  if (!overview) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  return NextResponse.json({ content: overview });
}

function parseBoolean(value: string | null) {
  if (!value) return false;
  return value === "true" || value === "1" || value === "yes";
}

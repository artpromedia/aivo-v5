import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { curriculumManager } from "@/lib/curriculum/curriculum-manager";

const querySchema = z.object({
  search: z.string().optional(),
  jurisdiction: z.string().optional(),
  subject: z.string().optional(),
  gradeBand: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const params = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!params.success) {
    return NextResponse.json({ error: params.error.flatten() }, { status: 400 });
  }

  const standards = await curriculumManager.listStandards({
    search: params.data.search,
    jurisdiction: params.data.jurisdiction,
    subject: params.data.subject,
    gradeBand: params.data.gradeBand,
    limit: params.data.limit
  });

  return NextResponse.json({ standards });
}

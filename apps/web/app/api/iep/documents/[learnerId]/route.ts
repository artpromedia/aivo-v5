import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ learnerId: string }> }
) {
  try {
    // Get session for auth
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { learnerId } = await params;

    if (!learnerId) {
      return NextResponse.json(
        { error: "Learner ID is required" },
        { status: 400 }
      );
    }

    // Forward to Python backend
    const response = await fetch(
      `${BACKEND_URL}/api/v1/iep/documents/${learnerId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken || ""}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to fetch documents" }));
      return NextResponse.json(
        { detail: error.detail || "Failed to fetch documents" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("IEP documents fetch error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

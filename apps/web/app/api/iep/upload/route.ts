import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    // Get session for auth
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const learnerId = formData.get("learner_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!learnerId) {
      return NextResponse.json({ error: "learner_id is required" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    // Validate file size (25MB max)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 25MB limit" },
        { status: 400 }
      );
    }

    // Create form data for backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    // Forward to Python backend - learner_id as query param
    const response = await fetch(
      `${BACKEND_URL}/api/v1/iep/upload?learner_id=${encodeURIComponent(learnerId)}`,
      {
        method: "POST",
        body: backendFormData,
        headers: {
          // Forward auth headers
          Authorization: `Bearer ${session.accessToken || ""}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      return NextResponse.json(
        { detail: error.detail || "Upload failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("IEP upload error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

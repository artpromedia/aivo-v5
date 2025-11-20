import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.info("[clone-model] received payload", payload);

    return NextResponse.json({ status: "queued" });
  } catch (error) {
    console.error("Failed to queue clone", error);
    return NextResponse.json({ error: "Unable to clone model" }, { status: 500 });
  }
}

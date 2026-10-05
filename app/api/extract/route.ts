import { NextResponse } from "next/server";
import { DEFAULT_MODEL, makeCallModel } from "@/lib/anthropic";
import { extractDocument } from "@/lib/extract";
import { allow } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60; // confirm Vercel's current limit for the plan

export async function POST(req: Request) {
  // Server only: the key is read here and never sent to the browser.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const limit = allow(`x:${ip}`, Date.now(), 10); // reading a file costs more than a check, so a smaller budget
  if (!limit.ok) {
    return NextResponse.json({ status: "unavailable", message: "That's a lot of uploads. Try again in a while." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }
  let body: { name?: unknown; mediaType?: unknown; data?: unknown };
  try {
    const text = await req.text();
    if (text.length > 4_400_000) throw new Error("too big");
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ status: "rejected", message: "Keep the file under 3 MB." }, { status: 400 });
  }
  if (typeof body.mediaType !== "string" || typeof body.data !== "string") {
    return NextResponse.json({ status: "rejected", message: "That request was not valid." }, { status: 400 });
  }
  const result = await extractDocument(
    { name: typeof body.name === "string" ? body.name : "Uploaded file", mediaType: body.mediaType, data: body.data },
    { callModel: makeCallModel(process.env.ANTHROPIC_API_KEY), model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL },
  );
  return NextResponse.json(result, { status: result.status === "rejected" ? 400 : 200 });
}

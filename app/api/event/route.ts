import { NextResponse } from "next/server";
import { getDemoCases } from "@/lib/data";
import { allow } from "@/lib/ratelimit";
import { backendFrom, fieldFor, record } from "@/lib/usage";

export const runtime = "nodejs";

/** Anonymous counter. Always answers 204 so the page never notices a failure. */
export async function POST(req: Request) {
  const backend = backendFrom(process.env);
  if (!backend) return new NextResponse(null, { status: 204 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!allow(`u:${ip}`, Date.now(), 120).ok) return new NextResponse(null, { status: 204 });

  try {
    const text = await req.text();
    if (text.length > 200) return new NextResponse(null, { status: 204 });
    const b = JSON.parse(text) as { event?: unknown; id?: unknown };
    const field = fieldFor(b.event, b.id, getDemoCases().map((c) => c.id));
    if (field) await record(fetch, backend, field);
  } catch {
    /* ignore */
  }
  return new NextResponse(null, { status: 204 });
}

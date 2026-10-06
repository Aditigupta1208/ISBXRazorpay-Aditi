import { NextResponse } from "next/server";
import { backendFrom, headline, readUsage, safeEqual } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Builder only: needs USAGE_ADMIN_TOKEN. Returns 404 when it is not set, so the route does not advertise itself. */
export async function GET(req: Request) {
  const admin = process.env.USAGE_ADMIN_TOKEN;
  if (!admin) return new NextResponse(null, { status: 404 });
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!safeEqual(given, admin)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const backend = backendFrom(process.env);
  if (!backend) return NextResponse.json({ error: "no_backend" }, { status: 503 });
  const report = await readUsage(fetch, backend);
  if (!report) return NextResponse.json({ error: "backend_unreachable" }, { status: 502 });
  return NextResponse.json({ ...report, headline: headline(report.total) }, { headers: { "Cache-Control": "no-store" } });
}

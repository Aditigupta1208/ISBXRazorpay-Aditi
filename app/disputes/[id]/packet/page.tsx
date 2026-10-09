import { notFound } from "next/navigation";
import { PacketView } from "@/components/PacketView";
import { getCase, getDemoCases, getCheckView } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDemoCases().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Evidence packet ${id} | Dispute Advisor (concept prototype)` };
}

export default async function PacketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCase(id);
  const view = getCheckView(id);
  if (!c || !view) notFound();
  return <PacketView c={c} view={view} />;
}

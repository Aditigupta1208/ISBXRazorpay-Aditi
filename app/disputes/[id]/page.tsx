import { notFound } from "next/navigation";
import { CaseView } from "@/components/CaseView";
import { getCase, getDemoCases, getCheckView } from "@/lib/data";
import { getRates } from "@/lib/fx";
import { listOrder, neighbours } from "@/lib/order";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDemoCases().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${id} | Dispute Advisor (concept prototype)` };
}

export default async function DisputeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCase(id);
  const view = getCheckView(id);
  if (!c || !view) notFound();
  const { prev, next } = neighbours(listOrder(await getRates()), id);
  return <CaseView c={c} view={view} prev={prev} next={next} />;
}

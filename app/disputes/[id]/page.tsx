import { notFound } from "next/navigation";
import { CaseView } from "@/components/CaseView";
import { getCase, getCases, getCheckView } from "@/lib/data";

export function generateStaticParams() {
  return getCases().map((c) => ({ id: c.id }));
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
  return <CaseView c={c} view={view} />;
}

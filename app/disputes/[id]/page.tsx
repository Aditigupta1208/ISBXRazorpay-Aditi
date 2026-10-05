import Link from "next/link";
import { notFound } from "next/navigation";
import { CallChip } from "@/components/CallChip";
import { getCase, getCases, getRuleText, getSavedResult } from "@/lib/data";
import { formatInrFull, formatOriginal, timeLeft, toInr } from "@/lib/format";

export function generateStaticParams() {
  return getCases().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${id} | Dispute Advisor (concept prototype)` };
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`mb-4 rounded-2xl border border-line bg-white p-[22px] shadow-[0_1px_2px_rgba(0,0,0,.03)] ${className}`}>
    {children}
  </section>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mt-4 mb-1.5 text-xs font-semibold tracking-[.6px] text-helper uppercase first:mt-0">{children}</h3>
);

export default async function DisputeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) notFound();
  const d = c.dispute;
  const saved = getSavedResult(c.id);
  const t = timeLeft(d.respond_by_hours_left);
  const inr = toInr(d.amount / 100, d.currency);
  const rule = getRuleText(d.reason_code);
  const slotFor = (eid: string) => saved?.slots.filter((s) => s.evidenceId === eid) ?? [];

  return (
    <>
      <Link href="/disputes" className="mb-2.5 inline-block font-semibold text-brand">
        ← All disputes
      </Link>

      <Card>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-[13px] text-[#555]">{d.id}</p>
            <h1 className="my-1 text-xl leading-[26px] font-semibold md:text-2xl md:leading-8">
              {formatOriginal(d.amount, d.currency)} · {d.network} {d.reason_code} {d.reason_description}
            </h1>
            <p className="text-[13px] text-helper">
              {c.merchant} Raised {d.raised_on}. {formatInrFull(inr)} at the demo rate.
            </p>
          </div>
          <div className="md:text-right">
            <div className={`text-[28px] font-semibold ${t.warn ? "text-warn" : ""}`}>
              {t.warn && <span aria-hidden>⚠ </span>}
              {t.text}
            </div>
            <div className="text-[13px] text-helper">left to respond</div>
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-4 md:grid-cols-[5fr_6fr]">
        <div>
          <Card>
            <H3>What the customer says</H3>
            <p className="mt-1 text-[17px]">&ldquo;{c.customer_claim}&rdquo;</p>
            {rule && (
              <>
                <H3>What this means</H3>
                <p>{rule}</p>
              </>
            )}
            <H3>What Razorpay knows</H3>
            <p>{c.razorpay_facts}</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <H3>Your evidence</H3>
              <span className="text-[13px] text-helper">{c.evidence.length} documents</span>
            </div>
            {c.evidence.map((e) => (
              <div
                key={e.id}
                id={`ev-${e.id}`}
                className="mt-2.5 grid grid-cols-[34px_1fr] gap-2.5 rounded-xl border border-[#F1F1F1] p-3"
              >
                <div className="flex h-[26px] items-center justify-center rounded-lg bg-shield-soft text-xs font-semibold">{e.id}</div>
                <div>
                  <p className="text-sm text-[#555]">{e.content}</p>
                  {slotFor(e.id).map((s) => (
                    <span key={s.slot} className="mt-1.5 mr-1 inline-block rounded-md bg-[#F6F6F6] px-[7px] py-0.5 font-mono text-[11.5px] text-[#555]">
                      {s.slot}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div className="order-first md:order-none">
          <Card>
            {saved ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <CallChip call={saved.call} size="lg" />
                  {saved.confidence && <span className="font-medium text-[#555]">{saved.confidence} confidence</span>}
                </div>
                {saved.reason && <p className="mt-3 text-[17px] font-semibold">{saved.reason}</p>}
                {saved.decidingEvidence.length > 0 && (
                  <>
                    <H3>Deciding evidence</H3>
                    <p>
                      {saved.decidingEvidence.map((e) => (
                        <a key={e} href={`#ev-${e}`} className="mr-1.5 rounded-md bg-brand-soft px-1.5 text-xs font-semibold text-[#2B5BC8]">
                          {e}
                        </a>
                      ))}
                    </p>
                  </>
                )}
                {saved.draft && (
                  <>
                    <H3>Draft response (v1, one sentence)</H3>
                    <p className="text-[15px] leading-[1.7]">{saved.draft}</p>
                  </>
                )}
                <p className="mt-4 text-xs text-helper">{saved.sourceLabel}</p>
              </>
            ) : (
              <p>No check yet.</p>
            )}
            <p className="mt-3 rounded-[10px] bg-[#FAFAFA] px-3 py-2 text-[13px] text-helper">
              The full check panel (money, safety checks, actions) arrives in the next milestone.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { getDemoCases } from "@/lib/data";

export const metadata = { title: "Page not found | Dispute Advisor (concept prototype)" };

export default function NotFound() {
  const first = getDemoCases().slice(0, 3);
  return (
    <section aria-labelledby="nf" className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-6 text-center md:mt-8 md:p-10">
      <p className="text-sm font-medium text-ink-soft">404</p>
      <h1 id="nf" className="mt-1 text-2xl font-semibold">We could not find that page</h1>
      <p className="mt-2 text-[14px] text-ink-soft">
        The link may be old, or the dispute does not exist in this demo. Try one of these instead.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link href="/disputes" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-focus">All disputes</Link>
        <Link href="/agent-studio" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:border-brand">Agent setup</Link>
        <Link href="/evals" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:border-brand">Evals</Link>
        <Link href="/how-it-works" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:border-brand">How it works</Link>
      </div>
      {first.length > 0 && (
        <p className="mt-5 text-[12px] text-helper">
          Open a dispute:{" "}
          {first.map((c, i) => (
            <span key={c.id}>
              {i > 0 && ", "}
              <Link href={`/disputes/${c.id}`} className="font-medium text-brand hover:underline">{c.id}</Link>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

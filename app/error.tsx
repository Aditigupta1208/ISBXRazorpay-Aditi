"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section role="alert" className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-6 text-center md:mt-8 md:p-10">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-[15px] text-ink-soft">
        Nothing was sent and nothing was lost. Try again, or go back to the list.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <button type="button" onClick={reset} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-focus">Try again</button>
        <a href="/disputes" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:border-brand">All disputes</a>
      </div>
    </section>
  );
}

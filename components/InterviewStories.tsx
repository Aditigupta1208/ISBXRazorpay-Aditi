import { Section } from "@/components/ui";
import { INTERVIEW_STORIES } from "@/lib/howContent";

/** Real disputes the three merchants described. Recalled, not logged, so they are listed and never counted in the numbers above. */
export function InterviewStories() {
  return (
    <Section id="interviews" title="From the interviews" note="Seven disputes three merchants described to us. Recalled by them, not logged, and not counted in any number on this page. Anonymised.">
      <ul className="grid gap-3 md:grid-cols-2" data-testid="interview-stories">
        {INTERVIEW_STORIES.map((s, i) => (
          <li key={i} className="rounded-2xl border border-line bg-white p-4 text-[14px]">
            <p className="text-[12px] font-semibold tracking-[.6px] text-helper uppercase">{s.who}</p>
            <p className="mt-1">{s.what}</p>
            <p className="mt-1 text-ink-soft"><b className="font-semibold text-ink">What happened:</b> {s.outcome}</p>
            <p className="mt-1 text-ink-soft"><b className="font-semibold text-ink">What it shows:</b> {s.lesson}</p>
            <p className="mt-2 text-[12px] text-helper">In our segment: {s.inSegment}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

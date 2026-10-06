/** The guided tour. Seven stops in the order a merchant asks questions, then two for reviewers. Plain words, no jargon. */
export interface TourStep {
  href: string;
  title: string;
  text: string;
  /** CSS selector of the part of the page to point at; the step still works if it is missing. */
  target?: string;
  /** Open the folded row the target points at, so the reviewer sees what the step talks about. */
  reveal?: boolean;
  /** Stops for judges and curious readers rather than for a merchant. */
  audience?: "reviewers";
}

export const TOUR_STEPS: TourStep[] = [
  {
    href: "/disputes",
    title: "1. Your disputes, most urgent first",
    text: "Each row is a card dispute. The advisor has already made a call on each: Fight, Fold or Escalate. Fraud disputes go to Chargeback Shield instead.",
    target: "tbody tr, ul[aria-label=Disputes] li",
  },
  {
    href: "/disputes/C06",
    title: "2. The answer comes first",
    text: "The call, the reason in one sentence, the money at stake, your chance of winning and the time you have. This one says Fight.",
    target: "#decision",
  },
  {
    href: "/disputes/C06",
    title: "3. Why you can believe it",
    text: "Every point traces to a document you gave it. Open your evidence to check the advisor's reasoning yourself.",
    target: '[data-row="evidence"]',
    reveal: true,
  },
  {
    href: "/disputes/C06",
    title: "4. You decide, not the advisor",
    text: "Review response opens a draft where every sentence cites a document. Nothing is sent until you approve, and in this prototype nothing is sent at all.",
    target: "#primary-action",
  },
  {
    href: "/disputes/C15",
    title: "5. When it is not sure, it says so",
    text: "Only half of this one is owed and a document is missing. The advisor does not guess: it names the one document to get and writes the message to ask for it.",
    target: "#get-first",
  },
  {
    href: "/results",
    title: "6. Did the advice turn out right?",
    text: "After you act, mark the dispute Won or Lost. Results compare the advisor's odds with what really happened, and your record shifts the next estimate. The past disputes here are made up.",
    target: "#advisor-right",
  },
  {
    href: "/agent-studio",
    title: "7. Teach it your own terms",
    text: "A business adds its refund and cancellation terms once. The panel shows exactly what the advisor is told. Your terms count as your claim, never as proof.",
    target: "#advisor-told",
  },
  {
    href: "/evals",
    title: "8. Can you trust it? The test",
    text: "Before an AI is allowed near money decisions, it is tested. This page scores the advisor on practice disputes against a person's answer, and shows where it is weak.",
    target: "#why-evals",
    audience: "reviewers",
  },
  {
    href: "/how-it-works",
    title: "9. How it works, in one example",
    text: "One dispute followed from start to finish in plain words, then the safety rules and how the system learns. That is the tour. Open any dispute to try it yourself.",
    target: "#one-minute",
    audience: "reviewers",
  },
];

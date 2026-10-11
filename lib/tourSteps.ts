/** The guided tour. One stop for where it sits, the merchant's questions in order, then three for reviewers. Plain words, no jargon. */
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
  /** Something the page should do when the step opens, so the reviewer sees the result instead of an empty panel. */
  action?: "bank-demo";
}

/** Sent to the page by the "bank-demo" step. The bank test answers from its saved example, so no model call is made. */
export const TOUR_BANK_EVENT = "da:tour-bank-demo";

export const TOUR_STEPS: TourStep[] = [
  {
    href: "/",
    title: "1. Start where you already work",
    text: "Disputes sits under Transactions in the Razorpay Dashboard, as today. Dispute Advisor adds its call to every dispute.",
    target: "#advisor-entry",
  },
  {
    href: "/disputes",
    title: "2. Your disputes, most urgent first",
    text: "Each row is a card dispute. The advisor has already made a call on each: Fight, Fold or Escalate. Fraud disputes go to Chargeback Shield instead.",
    target: "tbody tr, ul[aria-label=Disputes] li",
  },
  {
    href: "/disputes/C06",
    title: "3. The answer comes first",
    text: "The call, the reason in one sentence, the money at stake, your chance of winning and the time you have. This one says Fight.",
    target: "#decision-top",
  },
  {
    href: "/disputes/C06",
    title: "4. Why you can believe it",
    text: "Every point traces to a document you gave it. Open your evidence to check the advisor's reasoning yourself.",
    target: '[data-row="evidence"]',
    reveal: true,
  },
  {
    href: "/disputes/C06",
    title: "5. You decide, not the advisor",
    text: "Review response opens a draft where every sentence cites a document. Nothing is sent until you approve, and in this prototype nothing is sent at all.",
    target: "#primary-action",
    reveal: true,
  },
  {
    href: "/disputes/C06",
    title: "6. Test it on the bank first",
    text: "A second AI pass plays the cardholder's bank and attacks your draft: its strongest objection, your weakest sentence, a fix. This is a saved example. A practice run, not a bank decision.",
    target: '[data-tour="bank-body"]',
    action: "bank-demo",
  },
  {
    href: "/disputes/C15",
    title: "7. When it is not sure, it says so",
    text: "Only half of this one is owed and a document is missing. The advisor does not guess: it names the one document to get and writes the message to ask for it.",
    target: "#get-first",
  },
  {
    href: "/disputes/C06/packet",
    title: "8. The evidence packet is built for you",
    text: "Two merchants said they build the same exhibit pack by hand every time. Here it is: a cover summary, contents and numbered exhibits, ready to print or save as PDF.",
    target: '[data-tour="packet-cover"]',
  },
  {
    href: "/alerts",
    title: "9. It comes to you in time",
    text: "Merchants told us nobody clicks tabs. Pick Slack, WhatsApp or email and set rules by amount and reason. Each alert has the response already drafted. A preview: nothing is sent.",
    target: '[data-testid="alert-item"]',
  },
  {
    href: "/results",
    title: "10. Did the advice turn out right?",
    text: "After you act, mark the dispute Won or Lost. Results compare the advisor's odds with what really happened, and your record shifts the next estimate. The past disputes here are made up.",
    target: "#advisor-right",
  },
  {
    href: "/agent-studio",
    title: "11. Teach it your own terms",
    text: "A business adds its refund and cancellation terms once. The panel shows exactly what the advisor is told. Your terms count as your claim, never as proof.",
    target: "#advisor-told",
  },
  {
    href: "/disputes/C06",
    title: "12. Live or saved, you always know",
    text: "Run live check (or Re-run check) makes a real call to a free AI model. If it is busy or slow, you get the saved result from an earlier test run, and this label says which one you are looking at.",
    target: '[data-tour="source-label"]',
    audience: "reviewers",
  },
  {
    href: "/evals",
    title: "13. Can you trust it? The test",
    text: "Before an AI is allowed near money decisions, it is tested. This page scores the advisor on practice disputes against a person's answer, and shows where it is weak.",
    target: "#why-evals",
    audience: "reviewers",
  },
  {
    href: "/how-it-works",
    title: "14. How it works, at a glance",
    text: "The whole argument on one screen: three things to look at, what backs it up, and the brief's seven questions in a line each. The other tabs hold every detail. That is the tour. Open any dispute to try it yourself.",
    target: "#glance-core",
    audience: "reviewers",
  },
];

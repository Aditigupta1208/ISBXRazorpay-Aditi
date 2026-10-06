/** The guided tour: one stop per screen a reviewer should see, in order. Plain words, no jargon. */
export interface TourStep {
  href: string;
  title: string;
  text: string;
  /** CSS selector of the part of the page to point at; the step still works if it is missing. */
  target?: string;
  /** Open the folded row the target points at, so the reviewer sees what the step talks about. */
  reveal?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    href: "/disputes",
    title: "1. Your disputes, in order of urgency",
    text: "Each row is a card dispute for a service, subscription or digital sale. The advisor has already made a call on each one: Fight, Fold or Escalate. Fraud goes to Chargeback Shield. What is due soonest is first.",
    target: "table",
  },
  {
    href: "/disputes/C06",
    title: "2. A Fight call you can check",
    text: "The advisor says Fight, how sure it is, and which documents decide it. Open the safety checks to see seven rules run in code on the answer.",
    target: "#decision",
  },
  {
    href: "/disputes/C06",
    title: "3. Why AI, not a fixed checklist",
    text: "This box shows what a plain checklist would say on the same dispute. The money check below it shows what you could win, what you could lose and the fee.",
    target: '[data-row="checklist"]',
    reveal: true,
  },
  {
    href: "/disputes/C06",
    title: "4. Dates from your own documents",
    text: "For a cancelled subscription, the order of dates decides the case. Click E1, E2 or E3 to jump to the document behind a date.",
    target: '[data-row="timeline"]',
    reveal: true,
  },
  {
    href: "/disputes/C06",
    title: "5. You approve everything",
    text: "Press Review response to see a draft where every sentence cites a document. Nothing is sent until you approve, and in this prototype nothing is sent at all.",
    target: "#decision",
  },
  {
    href: "/disputes/C15",
    title: "6. When the advisor stops and asks",
    text: "This group tour is only half owed. The advisor does not guess: it says Escalate, names the one document it needs and writes the message to ask for it.",
    target: "#get-first",
  },
  {
    href: "/results",
    title: "7. Did the advisor turn out right?",
    text: "Results show what happened to disputes you acted on. The AI's odds are checked against real outcomes, and your own record moves them. The past disputes here are made up.",
    target: "#advisor-right",
  },
  {
    href: "/evals",
    title: "8. The proof, and its limits",
    text: "30 cases scored against an answer key, against a fixed checklist, and against hand-written rules on cases they had not seen. The page also lists what these numbers do not show.",
    target: "#rules",
  },
  {
    href: "/agent-studio",
    title: "9. Set up once",
    text: "A merchant adds their own refund and cancellation terms here, and the advisor reads them on every check. This is our own design of the screen, not Razorpay's.",
  },
  {
    href: "/how-it-works",
    title: "10. How it works, and what it will not do",
    text: "The seven safety rules, how the system learns, and how a change ships. That is the tour. Open any dispute to try it yourself.",
    target: "#learning",
  },
];

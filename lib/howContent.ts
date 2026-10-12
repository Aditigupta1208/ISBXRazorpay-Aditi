/** Plain-text content for the reviewer pages. Kept in one file so the claims are easy to check against the product. */

export const WHY_AI_POINTS: [string, string][] = [
  ["The input is not structured", "Contracts, chats, emails, login exports and vouchers all word things differently. A rule needs a field to test, and there is none. Something has to read the text."],
  ["What matters is what a document says, not that it exists", "The same terms record only wins if the cancellation clause was shown where the customer agreed. A login log only wins if the logins fall in the service period. A checklist can say \"present\"; it cannot say \"present, and it says the opposite\"."],
  ["The call depends on documents that disagree", "One document says the customer cancelled on 29 July, another shows use on 2 August. Deciding which one a bank will believe means comparing statements."],
  ["The response is a writing task", "Every sentence must come from a specific document and fit in 1,000 characters. A template cannot do that for a new case."],
  ["Rules multiply and then break each other", "We wrote nine extra rules that reached 20 of 20 on known cases. On ten unseen cases they scored 6, below the plain checklist's 7, because each rule written for one case broke another."],
];

export const CODE_VS_AI: { who: string; does: string }[] = [
  { who: "AI reads and writes", does: "Reads the documents, spots contradictions, applies Visa's rule to what they say, drafts the response, plays the bank." },
  { who: "Code does the sums and the safety", does: "Money maths, deadlines, the fraud routing, the nine safety rules, the card-number block, the check that every number and date is in a document." },
  { who: "You decide", does: "Every submit, fold and escalate needs a click. You can edit the draft, override the call or switch the agent off." },
];

export const FAILURES: { risk: string; stops: string; rule: string }[] = [
  { risk: "The AI gives the wrong call with weak support", stops: "A Fight on low confidence or without a key document for that reason is changed to Escalate.", rule: "R4, R8" },
  { risk: "The AI names deciding documents that are not in this dispute", stops: "Deciding documents must exist in this dispute. A source that is not in the dispute is refused.", rule: "R3" },
  { risk: "A sentence in the draft has no source", stops: "Every sentence must end with a source such as [E1], or the draft is stopped.", rule: "R2" },
  { risk: "The draft states a number, date or count the documents do not show", stops: "The figure check compares each one with the cited documents and the dispute record and stops the draft.", rule: "R9" },
  { risk: "The draft is longer than Razorpay allows", stops: "Over 1,000 characters is stopped; Shorten for me offers a version that adds nothing new.", rule: "R6" },
  { risk: "A full card number is pasted into evidence or the draft", stops: "Detected, including with dots, spaces and full-width digits. The draft is stopped and you are told to remove it.", rule: "R7" },
  { risk: "A fraud dispute is treated as a service dispute", stops: "Fraud reason codes go to Chargeback Shield with no model call.", rule: "R5" },
  { risk: "A document contains hidden instructions", stops: "Evidence is wrapped and treated as data. The model can call only the one forced tool, and every action needs a click. One test case (C19) hides an instruction in a document.", rule: "Evidence wrapper" },
  { risk: "The model is busy, slow or answers badly", stops: "One retry, then a labelled saved result. With no key the app still works and says it is a saved result.", rule: "Fallback" },
  { risk: "A missed deadline", stops: "Alerts with a response already drafted, at rules you set. Preview only here.", rule: "Alerts" },
];

export const METRICS: { level: string; name: string; why: string; today: string }[] = [
  { level: "North star", name: "Net dispute value recovered each month", why: "Rupees won back plus losses avoided, after the cost of fighting.", today: "Shown as recovered per rupee disputed on Results (sample data, labelled)." },
  { level: "Driver", name: "Disputes answered before the deadline", why: "A missed deadline is an automatic loss. One merchant lost a winnable USD 99 dispute this way.", today: "On-time rate on Results." },
  { level: "Driver", name: "Win rate on Fight calls", why: "Shows whether the advisor's Fight calls are worth the effort.", today: "Win rate and calibration by confidence on Results." },
  { level: "Driver", name: "Time spent per dispute", why: "One merchant described about 18 hours over two days for a USD 149 dispute.", today: "Not measured in the prototype. Target: under 30 minutes. A target, not a result." },
  { level: "Guardrail", name: "Wrong-Fight and wrong-Fold rates", why: "A confident wrong call costs money. Both are watched, not just the headline accuracy.", today: "On Evals, with launch bars." },
  { level: "Guardrail", name: "Drafts stopped by a safety rule", why: "Shows how often the model writes something it cannot support.", today: "Shown on each dispute and in the eval run (first-try citation rate)." },
];

export const TIERS: { tier: string; note: string; items: [string, string][] }[] = [
  {
    tier: "Core",
    note: "If you only look at three things.",
    items: [
      ["Fight-or-Accept check", "Fight, Accept or Get a document, priced in rupees, with the reason and the deciding documents."],
      ["Cited response and figure check", "A draft in which every sentence names a document, and a list of every number and date with its source."],
      ["Merchant control and safety rules", "Nothing is sent without a click. Nine code checks run after every answer."],
    ],
  },
  {
    tier: "Supporting",
    note: "Each one makes a core feature better.",
    items: [
      ["Evidence checklist and key facts", "What is in place for this reason code, and what each document says."],
      ["Bank's rebuttal", "A practice run where a second prompt plays the cardholder's bank and finds the weakest sentence."],
      ["Worth finding?", "On Escalate, a ceiling on what the missing document could be worth."],
      ["Alerts and deadline rescue", "A nudge in Slack, WhatsApp or email with the response already drafted. Preview only here."],
      ["Results and odds blend", "Your own outcomes shown back to you, and blended into the odds."],
      ["Evals and release gate", "The agent against a fixed checklist on 40 practice disputes, with launch bars."],
    ],
  },
  {
    tier: "Convenience",
    note: "Small things merchants asked for or that save a step.",
    items: [
      ["Priority inbox and CSV", "Due soonest first, Shield last, export for a spreadsheet."],
      ["Evidence packet, copy summary, policy patch", "A printable packet, a summary to forward, and a suggested terms change after a loss."],
      ["Shorten for me", "Brings a long draft under 1,000 characters without adding anything."],
      ["Dispute ratio tile", "Type your numbers to see the ratio against published bands."],
      ["Guided tour", "Fourteen stops, merchant questions first, for a first visit."],
    ],
  },
];

export const POSITION: { name: string; covers: string; who: string; gap: string; ours?: boolean }[] = [
  { name: "Chargeback Shield (Razorpay)", covers: "Fraud-coded disputes on international payments.", who: "Razorpay handles it for the merchant.", gap: "Its terms exclude disputes about the quality, delivery or description of goods or services." },
  { name: "Razorpay's Dispute Responder", covers: "Helps a merchant respond to a dispute from the evidence they provide.", who: "The merchant, with help.", gap: "We assume it does not tell the merchant whether to fight or fold on their own evidence. Not confirmed with Razorpay." },
  { name: "Dispute Advisor (this prototype)", covers: "Non-fraud disputes: service not provided, cancelled, not as described, refund not processed.", who: "The merchant approves every step.", gap: "Adds the call (Fight, Accept or Get a document), the money maths, a draft in which every sentence cites a document, and a test against a practice bank reviewer.", ours: true },
];

export const HEARD: { heard: string; who: string; built: string; status: string }[] = [
  { heard: "The evidence that wins sits in someone else's system: a cloud host, a courier, an ad platform, WhatsApp. Pulling it takes one to two days.", who: "All three", built: "Per-reason evidence checklist, \"get this first\" on Escalate, and the count of key documents in place.", status: "Built" },
  { heard: "Build the packet for me. Two of them make the same exhibit pack by hand each time.", who: "Two of three", built: "Evidence packet with a cover summary, contents and numbered exhibits.", status: "Built" },
  { heard: "Three business days, often with a meeting or travel in the way. One lost a winnable USD 99 dispute to the clock.", who: "Two of three", built: "Alerts and Deadline rescue: the response already drafted, with a link that opens it for review.", status: "Built as a preview" },
  { heard: "Nobody clicks tabs. They want a message in Slack or WhatsApp, with rules by amount and by reason. A dollar and five hundred hit the same way.", who: "All three", built: "Alert rules by amount and by reason, with a channel preview.", status: "Built as a preview" },
  { heard: "Small, unused disputes get accepted without a look.", who: "Two of three", built: "Fold as a first-class call, with the money check.", status: "Built" },
  { heard: "A Fold or Escalate has to name the missing document, not give a percentage. Made-up percentages are not trusted.", who: "All three", built: "The call names the gap. The chance to win is small and labelled as a rough estimate.", status: "Built" },
  { heard: "Before approving they check amounts, dates, counts and tracking numbers in the draft.", who: "All three", built: "\"Check these before you approve\": every figure with the document it came from, and a code check that stops a draft with an unsupported figure.", status: "Built" },
  { heard: "Never send, refund or accept for me.", who: "All three", built: "Nothing is sent without a click, and the \"will never do\" list says so.", status: "Built" },
  { heard: "Reason codes are bare numbers and had to be looked up.", who: "One", built: "Plain-English reason names beside the code.", status: "Built" },
  { heard: "After a loss they changed their process: a terms tick box, a usage summary email, milestone approvals, photos of sealed boxes.", who: "All three", built: "Prevention tip after a loss and a policy patch.", status: "Built" },
  { heard: "None can see their dispute ratio.", who: "Two of three", built: "Ratio tile from numbers you type, against published bands.", status: "Built" },
  { heard: "No assignment, internal notes or history of similar disputes. A spreadsheet is used instead.", who: "One", built: "Team features were left out on purpose. History is partly covered by Results.", status: "Not built" },
  { heard: "\"Submit now and mark the rest pending.\"", who: "Two of three", built: "Rejected. A submitted contest cannot be added to (Razorpay's contest API and a reply from Razorpay support), so the advice is to save a draft, get the document, then submit.", status: "Rejected on evidence" },
];

export const MERCHANT_LIMITS = [
  "Three merchants, one of them outside our segment (physical goods). Signals that shaped choices, not proof of how most merchants behave.",
  "They answered questions about a described message, not about this product. What people say they would do is weaker than what they do.",
  "No merchant has used the prototype yet. A 10-minute walkthrough on three cases is the next test.",
  "Names and businesses are removed. The notes are held by the builder.",
];

export const INTERVIEW_STORIES: { who: string; what: string; outcome: string; lesson: string; inSegment: string }[] = [
  { who: "Merchant A, one-person software app", what: "\"Service not received\", USD 149. 47 logins in three months; the proof sat in the cloud host.", outcome: "Fought and won, about 25 days. About 18 hours of work over two days.", lesson: "The evidence existed; assembling it was the cost.", inSegment: "Yes" },
  { who: "Merchant A", what: "Renewal dispute, USD 12. No logins in 60 days and no reminder sent before renewing.", outcome: "Accepted without fighting.", lesson: "Accepting a small, unused dispute is what he already does by hand. A renewal reminder would prevent it.", inSegment: "Yes" },
  { who: "Merchant A", what: "\"Unauthorized\" dispute, USD 99. He had 3-D Secure and login logs but was travelling.", outcome: "Missed the 3-day deadline. Closed as a loss.", lesson: "Lost to the clock, not to the evidence. This is a fraud-type reason, so the prototype would route it to Chargeback Shield; the lesson is about the deadline.", inSegment: "Reason is outside our scope" },
  { who: "Merchant C, six-person agency", what: "\"Services not rendered\", USD 2,400. Four months of approved work; proof in an ad account and a chat.", outcome: "Fought and won, about 25 days.", lesson: "Approval emails and access history won it.", inSegment: "Yes" },
  { who: "Merchant C", what: "\"Services not rendered\", USD 450. A staff member left and two weeks of work were missed.", outcome: "Accepted, because the agency had failed. The client left.", lesson: "Accepting is right when your own record admits the problem. Access logs alone are not enough.", inSegment: "Yes" },
  { who: "Merchant B, skincare brand", what: "\"Merchandise not received\", USD 85. Delivered with a signature.", outcome: "Fought and won, about 30 days.", lesson: "Proof captured before the dispute wins.", inSegment: "No (physical goods)" },
  { who: "Merchant B", what: "Goods dispute, USD 120. \"Delivered to reception\" with no name or signature.", outcome: "Lost.", lesson: "Thin evidence loses. She now requires a signature and photographs every box.", inSegment: "No (physical goods)" },
];

export const TOOLS: { name: string; used: string; note: string }[] = [
  { name: "Groq-hosted models (qwen/qwen3.8-27b, then openai/gpt-oss-120b)", used: "The live check, the bank test and the helpers.", note: "Free tier. A busy model can refuse a call, and then the app shows a saved result." },
  { name: "Saved results (ChatGPT 5.6 Terra, prompt v1)", used: "The first 16 disputes when no live check runs.", note: "Each is labelled Saved result with the model and prompt version." },
  { name: "Anthropic Claude API", used: "Built as an alternative provider. Not run against the real API.", note: "Switched on by a key. The prototype does not depend on it." },
  { name: "ECB exchange rates (frankfurter)", used: "USD to rupee conversion.", note: "Cached for 12 hours. Falls back to a labelled demo rate." },
  { name: "Visa merchant dispute guidelines (June 2024) and Razorpay's contest API and blog", used: "The rule for each reason code, the 11 evidence slots, the 1,000-character summary, the USD 600 arbitration fee.", note: "Public documents, read by the builder. Not legal or Visa advice." },
  { name: "Vercel hosting, optional Supabase counter", used: "Hosting. An optional anonymous count of events (no names, IPs or evidence).", note: "The app works without the counter." },
];

export const ASSUMPTIONS: { a: string; check: string }[] = [
  { a: "Razorpay's Dispute Responder does not recommend fold or fight on a merchant's own evidence.", check: "Ask the Agent Studio team, or compare against its real output on the same disputes." },
  { a: "The merchant can get the documents into the agent (upload, paste, or later a connection).", check: "In a pilot, measure how many disputes had every key document available within a day." },
  { a: "Our reading of Visa's rules matches how issuing banks decide.", check: "Compare our calls with real outcomes by reason code and bank." },
  { a: "The model's odds are roughly right.", check: "Calibration on real outcomes. Today Results compares confidence with outcomes on sample data only." },
  { a: "Merchants will act on a Slack or WhatsApp alert with a drafted response.", check: "Measure how many alerts led to a reviewed response before the deadline." },
  { a: "A submitted contest cannot be added to.", check: "Already supported by Razorpay's contest API page and a reply from Razorpay support. Re-check before launch." },
];

export const SHADOW_MODE =
  "How we would check this on real data: run the advisor in shadow mode on a few hundred past disputes from willing merchants, with outcomes known. Compare its call with what the merchant did and what happened. Measure wrong-Fight and wrong-Fold rates and calibration, and compare against the fixed checklist. Nothing is sent to anyone; the merchant sees the advice after the fact.";

export const LOOP_STEPS: { title: string; note: string; who: "You" | "Automatic" | "Builder" }[] = [
  { title: "You mark the outcome", note: "Won or Lost, once you know.", who: "You" },
  { title: "Your record updates", note: "Results and the confidence calibration change.", who: "Automatic" },
  { title: "The next estimate moves", note: "The AI's estimate counts as a few past fights; your record blends in.", who: "Automatic" },
  { title: "A miss becomes a candidate test", note: "Download it with names and numbers masked.", who: "You" },
  { title: "A person confirms the answer", note: "The case joins the eval set only after the builder gives the label.", who: "Builder" },
  { title: "A change ships only if the gate passes", note: "Run the eval, then check the launch bars. Nothing is retrained.", who: "Builder" },
];

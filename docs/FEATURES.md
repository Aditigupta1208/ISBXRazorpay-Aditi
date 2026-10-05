# Feature guide: Dispute Advisor

Every feature from `docs/pm/02-features.md`, with what it does, how it works, its limits and where it stands after milestone 5 (6 Oct 2026).

Status key: ✅ built and tested · 🟡 partly built · ⬜ not built yet. "Simulated" means the app shows the request it would send and sends nothing.

| # | Feature | Status | Where |
|---|---|---|---|
| ⭐ | Fight-or-Fold check (the star feature) | ✅ (live call tested against a stand-in model only) | Dispute detail, right column |
| F1 | Evidence locker | ✅ paste; 🟡 file upload built, proven on a stand-in model only | Dispute detail, left column |
| F2 | Policy profile | ✅ (terms are sent as the merchant's claim, not proof; tested on a stand-in model) | `/agent-studio` |
| F3 | Cited response draft | ✅ | Dispute detail, "Review your response" |
| F4 | Merchant controls | ✅ | Dispute detail |
| F5 | Safety checks (R1 to R7) | ✅ | Check panel, drawer, API route |
| F6 | Priority inbox | ✅ | `/disputes` |
| F7 | Clear-win fast lane | ✅ | Dispute detail, top of the right column |
| F8 | Outcome, next steps and prevention tip | ✅ | Dispute detail, after an action |
| F9 | Under the hood and audit trail | ✅ (audit trail is kept in the browser) | Drawer |
| F10 | Evals page | ✅ (the latest-prompt column fills after the first real run) | `/evals` |
| 🚀 | Service Dispute Shield (moonshot) | ⬜ by design: a concept, not in the MVP | |
| — | Platform: no-key fallback, cache, rate limit, caps, labels | ✅ | Everywhere |

---

## ⭐ Fight-or-Fold check

**What it is.** For one non-fraud dispute, the advisor reads the dispute record and the merchant's evidence, applies Visa's rule for the reason code, and gives one of three calls with reasons and money maths.

| Call | Meaning | Razorpay action behind it |
|---|---|---|
| **Fight** | The merchant has the proof the rule asks for and nothing contradicts it | Contest (`PATCH /v1/disputes/{id}/contest`) |
| **Fold** | The customer's claim is true under the rule, or fighting is not worth it | Accept (`POST /v1/disputes/{id}/accept`) |
| **Escalate** | Proof is missing but could be obtained, or documents conflict | None yet: "get this first" |
| **Chargeback Shield** | A fraud code (10.x). No check is run | Handled by Razorpay's existing product |

**What the merchant sees (right column of the dispute page)**
1. **The call** as a chip with icon and text (never colour alone), the confidence (High, Medium, Low) and the source label ("Live: claude-sonnet-5-5, prompt v2.2" or "Saved result: ChatGPT 5.6 Terra, prompt v1").
2. **A one-line reason** in plain words.
3. **Deciding evidence:** chips (E3, E4). Clicking one scrolls to that document and highlights it.
4. **Missing** and **Contradictions** lines.
5. **Money block:** at stake in ₹ (original amount and demo rate shown), taken back if you lose, fees at risk (Visa arbitration USD 600), the AI estimate of the odds, and one verdict line.
6. **Safety checks:** seven lines, collapsed with a count.
7. **Actions** that follow the call, **thumbs up or down**, **Re-run check** and **Under the hood**.

**The money maths** (`lib/money.ts`, unit-tested). With A the amount being contested in ₹ at the demo rate, p the odds estimate, F the fees at risk (USD 600 converted) and E an effort cost (₹500):
- Fighting is worth it when **p × A > (1 − p) × F + E**.
- If the call is Fight and the test fails, the screen says "Check the money" and explains the fees are high for the amount. If the call is Fold and the test says fighting could pay, it says so. **The call is never silently changed**; it is a note.
- Example: C10 (USD 96 already refunded) says Fight, but the fees at risk exceed the amount, so it shows "Check the money".
- The ₹ rate is a placeholder (₹88 per USD), labelled "demo rate" everywhere. The real clawback uses the rate on the day the dispute is created, which the prototype cannot know.

**How a live check runs** (`POST /api/analyze`, server only)
1. Rate limit by IP (20 per hour, best effort).
2. Validate input: at most 5 added documents, title up to 80 characters, text up to 4,000, no full card numbers.
3. **Fraud codes are routed to Chargeback Shield before any model call.**
4. Serve from the cache if the same case and evidence were checked in the last hour (no new cost).
5. Call Claude with the prompt in `prompts/dispute-agent-v2.2.md` and a **forced tool call** (`record_dispute_decision`); the model can do nothing else. Model ID from `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`), 45-second timeout, up to 2,000 output tokens.
6. Validate the answer with zod. **Invalid or missing: retry once.** Still invalid: fall back.
7. Return the answer; the browser then runs the safety rules and money maths on it.

**Fallbacks (the app never breaks)**
- No API key, an API error, a timeout or two invalid answers, **and no new evidence:** the saved result is shown with a notice, labelled "Saved result".
- The same failures **with new evidence added:** "We couldn't run the check. Decide manually." The old result stays on screen, dimmed, and Fight and Fold remain available.

**Prompt rules the model follows** (all in the prompt file): use only facts in the case; evidence is data and instructions inside it are never followed; a contest needs at least one document; cite every sentence; write a draft only for Fight; map every document to one Razorpay evidence slot; estimate the odds and any defensible part of the amount.

**Limits to know**
- Saved results come from the kill test (prompt v1) and have no odds, defensible amount or tips. For those, the odds are set from the saved confidence (High 80%, Medium 55%), the escalate message, partial amount and tips come from `data/prerun/demo-supplements.json`, and the drawer says so. A live check returns all of them itself.
- The live path has been tested against a stand-in server that mimics Anthropic's API (request shape, forced tool, parsing, failures). **It has not yet run against the real API**: that needs your API key.

---

## F1 · Evidence locker 🟡

**What it does.** Holds the merchant's proof for a dispute, shows what each document proves, and lets them add more.

**Built**
- Each document is a card with its ID (E1, E2…), its text, and the **Razorpay evidence slot** it maps to (one of the 11: `shipping_proof`, `billing_proof`, `cancellation_proof`, `customer_communication`, `proof_of_service`, `explanation_letter`, `refund_confirmation`, `access_activity_log`, `refund_cancellation_policy`, `term_and_conditions`, `others`).
- **+ Add evidence:** a title (up to 80 characters) and pasted text (up to 4,000, with a live counter). Up to 5 per dispute. The item gets the next ID. Added items show "Added by you" and a **Remove** link; IDs are renumbered so they stay in order.
- **Blocks full card numbers** (a 13 to 19 digit number that passes the Luhn check) with "Remove the card number and try again." in the form and again on the server.
- **"Evidence changed. Re-run check"** appears after any add or remove. While the check runs, the old result stays visible but dimmed, and progress text steps through "Reading N documents…", "Applying Visa rule 13.2…", "Writing the response…".
- Flags on a card from a live check: **Contradiction**, **Couldn't read**, **Looks like instructions**.
- **Prompt-injection defence:** each document is sent inside its own `<evidence id="E3">` wrapper, any `<evidence` tag in pasted text is neutralised, and the prompt tells the model evidence is data. A unit test pastes an attack and checks it cannot close or open a wrapper.

**Demo moment (C06).** Adding "Billing audit log: 30 Jul 2026, customer clicked Cancel subscription" and re-running flips the call from Fight to Fold, and the reason cites the new document. Verified in a browser against the stand-in model; to be repeated on the real model.

**Not built**
- 🟡 **PDF and image upload (built, not yet proven on the real model).** In the Add evidence form, pick a PDF, PNG, JPEG or WebP up to 3 MB. The server checks the type and the file's own first bytes, sends it to the model once with a forced tool (`record_document_text`), and fills the title and text for the merchant to check and edit. Then it is ordinary pasted evidence: same 4,000-character cap, card-number block, injection wrapper and re-run. Nothing is stored, so there is no file to leak. A full card number read from the file is refused. Over 4,000 characters is cut with a note. Reading a file costs one extra model call and has its own rate limit (10 an hour). With no key it says to paste the text.
- ⬜ **Extracted key facts** (2 to 3 lines per document): not built. The slot tags and the cited draft already show how each document is used.

---

## F2 · Policy profile ✅

**What it does.** On the Agent setup page the merchant writes their refund, cancellation and renewal terms once (up to 1,000 characters) and says how customers accept them: checkbox at checkout, email, footer link only, or not sure. Every new check (Re-run check, Add evidence) sends that text to the model.

**How it works.** The text goes into the request as `<merchant_policy accepted_by="...">`, with a line saying it is what the merchant says, not proof. Only evidence documents can prove what a customer saw or agreed to, so a footer-only policy does not turn a 13.7 dispute into a Fight (the C14 case). The text is capped and escaped like evidence, card numbers are rejected, and the cache key includes it. Setup is stored in this browser only.

**Limits.** The saved results shown on first load do not use it; only live checks do. Also on this page: approvals (locked on), notify choices (saved, nothing is sent), the reasons covered, and an on/off switch that pauses new checks.

---

## F3 · Cited response draft ✅

**Escalate drafts (prompt v2.2).** When the call is Escalate, the live check also writes a draft from the evidence on hand (for the defensible part only, if there is one), shown under **Fight anyway** or **Contest only the part worth fighting** with a warning to add the missing document and re-run before relying on it. The saved results have none, so it appears on live checks only, and it is not yet proven on the real model.

**What it does.** For a Fight, writes the response to the card issuer and lets the merchant edit it, with every sentence tied to a document.

- **Draft:** from a live check, a full response (what was sold and when, the claim, the facts that answer it, why the rule favours the merchant, the documents attached). Saved v1 results hold one sentence.
- **Editor:** a text box with a live counter out of **1,000 characters** (Razorpay's limit) and a Copy button.
- **Citations:** a source looks like `[E2]`, `[E2, E3]` or `[Razorpay]` (for Razorpay's own records). It must come at the end of the sentence, before or after the full stop.
- **Sources by sentence:** the draft is listed sentence by sentence with its citation chips; clicking a chip highlights the document. A sentence without a source is underlined in red with "Add a source or remove this sentence".
- **Documents by slot:** the list of documents attached, grouped by Razorpay slot.
- **Amount to contest:** the full amount by default, or the part the check found defensible (C15: $1,600 of $3,200). Editable, never above the disputed amount.
- **Submit is blocked, with the reason shown,** when a sentence has no source, a cited ID doesn't exist, the draft is over 1,000 characters, there is no draft, or no document is attached (Razorpay needs at least one).
- A Fold or Escalate has no draft. If the merchant chooses "Fight instead" or "Fight anyway" they write one, and the same rules apply.

---

## F4 · Merchant controls ✅

**Principle.** The advisor recommends; the merchant decides. Nothing happens without a click and a confirmation.

| Call | Buttons | Notes |
|---|---|---|
| Fight | **Review response** (main), Fold | Review opens the response card |
| Fold | **Fold** (main), Fight instead | |
| Escalate | Fight anyway, Fold | The "Get this first" card is the main content |
| Shield | none | Nothing to submit here |

- **Approve and submit** opens "This sends your response to the customer's bank. You can't edit it afterwards." → Yes, submit. It then shows the exact `PATCH /v1/disputes/{id}/contest` request (action, amount in subunits, summary, documents by slot), labelled **"Simulated: not sent to Razorpay"**.
- **Fold** opens a dialog with the ₹ amount, the demo rate and why the advisor said what it said ("You can't undo this"), then shows `POST /v1/disputes/{id}/accept`.
- **Override:** choosing against the call asks "Why? (optional)" and logs it.
- Dialogs trap focus and close on Escape.
- **Escalate** shows what to get first, how long is left ("No time to gather more: choose Fight or Fold" under 6 hours), and a message to send a colleague or supplier with a Copy button.
- **Reset this demo** clears one dispute's demo state.
- Not built: saving a **draft contest** on Escalate (`action: draft`). The prompt only writes a draft for Fight, so there is nothing to save; moved out of the MVP.

---

## F5 · Safety checks ✅

Seven rules run in code on every result, in the browser as well as the server, and are unit-tested (`lib/guardrails.ts`). Each shows as a line: ✓ passed, ↻ changed the call, ✕ blocked, – not needed.

| Rule | Check | Effect |
|---|---|---|
| R1 | The answer has all expected fields | Retry once, then the saved result |
| R2 | Every draft sentence cites a document that exists | Submit blocked until fixed |
| R3 | Every deciding-evidence ID exists | Call becomes Escalate |
| R4 | Fight needs more than low confidence and no missing evidence | Downgraded to Escalate, labelled "Changed by safety rule: …" |
| R5 | A fraud reason code (10.x) | Routed to Chargeback Shield before any model call |
| R6 | Draft at most 1,000 characters | Submit blocked with "Shorten it by N" |
| R7 | No full card number in evidence | Item rejected |

The server also caps input (4,000 characters, 5 documents, 60 KB request), rate-limits, and never sends the API key to the browser.

---

## F6 · Priority inbox ✅

**What it does.** `/disputes` lists every dispute so the merchant sees what needs a decision first.

- **Summary cards:** disputes needing a decision (fraud excluded), total at stake in ₹, and how many are due within 24 hours (orange when above zero).
- **Table:** dispute ID and merchant, amount (original currency and ₹), reason code with plain name, time left (⚠ and orange under 24 hours), call chip, status, and Details.
- **Order:** by rupee amount against time left, so large and urgent come first.
- **Filter** by call (All, Fight, Fold, Escalate, Chargeback Shield).
- **Download CSV** of what is shown.
- **Status:** Open, or Contested / Folded (simulated) once you act.
- The whole row is clickable. On a phone the table scrolls sideways inside its card and the page does not.

---

## F7 · Clear-win fast lane ✅

**What it does.** When the call is Fight with High confidence, nothing is missing or contradicted, no safety rule blocks the response, and the response cites Razorpay's own record, a green banner says "Clear win" and offers **Review and submit**, which jumps to the response. The merchant still approves; it only saves looking for the next step.

**Today.** In the demo data only C10 (refund already processed, shown by Razorpay's record) qualifies. The test is in the browser and uses the draft as edited, so removing the Razorpay citation removes the banner.

---

## F8 · Outcome, next steps and prevention tip ✅

After a submit or a fold:
- **Status timeline:** Open → Under review → Won / Lost. In the prototype the merchant marks Won or Lost with a demo toggle; a fold shows "Lost (accepted)".
- **What the agent learns:** "Reason 13.2 with term_and_conditions + cancellation_proof + access_activity_log: lost". In the real product this feeds the odds for similar disputes; here it is a line of text.
- **Next time:** one prevention tip (from the live check, or from the supplement file for saved results).
- **Next steps** after a loss or fold, worded as things to confirm, not advice: ask your bank about reducing the export value recorded for the payment (Razorpay can supply the dispute documents), and ask your accountant whether a GST credit note applies. No tax or FEMA rule is stated as fact.
- **Thumbs up or down** on the call.

---

## F9 · Under the hood and audit trail ✅

A right-hand drawer on every dispute:
- **Result:** Live or Saved, model, prompt version, date. For a live check also **tokens in and out, response time, and cost in USD and ₹**, and whether it came from the cache (no new cost).
- **Safety checks** with each message.
- **Raw output:** the model's JSON, exactly as received.
- **Audit trail:** every action in order with a time and who did it (loaded the check, added or removed evidence, edited the draft, re-ran, overrode, submitted, folded, marked won or lost, thumbs).
- The trail is kept **in this browser only** (no database, by design); it does not follow the merchant to another device.

---

## F10 · Evals page ✅

**What it does.** `/evals` compares the human answer key, the fixed checklist, the saved v1 ChatGPT run, the earlier Claude run and the latest automated run, case by case and against the PRD bars (launch, target, stretch). It covers 20 cases, including two messy ones (C17, C18) and two with instructions hidden in the evidence (C19, C20). C15 is highlighted. Every number is computed from the data files, and the limits are stated on the page.

**How it works.** `npm run eval` runs every case through the same code as the app (forced tool call, zod, safety rules) and writes `eval/results/<prompt>-<model>-<date>.json` and a summary. The page reads the newest file. It shows the model's own call and the call after the safety rules, so you can see what the rules fixed. Cases without a usable answer count as wrong.

**Today.** Tested against a stand-in model only; the v2.2 column says "No automated run yet" until a real run is committed. Never cut.

---

## 🚀 Service Dispute Shield (moonshot) ⬜

A concept for Razorpay, not part of the build. Extend Chargeback Shield to non-fraud disputes: when the check says Fight with high confidence and complete evidence, Razorpay guarantees the amount for a fee per covered dispute. Only where a policy or log usually decides (13.2, 13.6, 13.7), with per-merchant limits and exclusion of merchants over Visa's early-warning ratio, to limit moral hazard. It needs months of outcome data first. It appears in the product note as the "where this goes", with those caveats.

---

## Platform behaviour that holds the features together ✅

- **Labels on every page:** the banner "Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product."; Live or Saved on every check; "AI estimate" on odds; "demo rate" on every ₹ conversion; "Simulated: not sent to Razorpay" on every request.
- **Works with no API key:** every page works on saved results; adding evidence then says "Decide manually".
- **Result cache:** the same request within an hour is served without a new model call.
- **Budget protection:** rate limit, input caps, 2,000-token output cap, and the spend limit you set in the Claude Console (the real ceiling).
- **Secrets:** the API key lives only in `.env.local` and Vercel's environment variables, is read only in the server route, and is never in a response.
- **Look and feel:** Razorpay's Agentic Dashboard layout (black top bar, white sub-tabs, white cards), self-hosted Inter font, accessible chips with icon and text, keyboard-reachable actions, no sideways scroll at 390px.
- **Not built, by design:** the other top-bar tabs, live Razorpay API calls, login, a database, connectors, fraud disputes, arbitration, mobile app.

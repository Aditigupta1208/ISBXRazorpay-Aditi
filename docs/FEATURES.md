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
| F11 | Results (learning loop and measurement) | ✅ | `/results`, and a line on each check |
| F10 | Evals page | ✅ (the latest-prompt column fills after the first real run) | `/evals` |
| 🚀 | Service Dispute Shield (moonshot) | ⬜ by design: a concept, not in the MVP | |
| — | Platform: no-key fallback, cache, rate limit, caps, labels | ✅ | Everywhere |
| — | Anonymous usage counter (optional) | ✅ (tested on a stand-in database) | `/usage`, builder only |

---

## ⭐ Fight-or-Fold check

**Deep dive 1 (6 Oct).** After a re-run that changes the call, a blue banner says "The call changed: Fight → Fold" and names the new document that decided it, with a "Show the document" button; it survives a reload until dismissed. The fee tile is now "Possible fee if you fight and lose" (Visa arbitration, only if the bank escalates), because "Fees at risk" looked larger than the dispute itself on small amounts.

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
- **Live rate (6 Oct).** The ₹ rate is the ECB reference rate from frankfurter.dev (no key), fetched on the server, cached 12 hours, 3 second timeout (`lib/fx.ts`, `lib/rates.ts`). Labels say "live rate" with the date, and "Indicative only; Razorpay converts at its own rate". If the fetch fails or returns an odd value (outside ₹40 to 200) the app falls back to the old ₹88 demo values and says "demo rate". `FX_RATE_INR_PER_USD` pins the USD rate ("fixed rate"), so the video, the note and the live demo can show the same numbers. The Visa arbitration fee (USD 600) stays a cited, labelled value because Visa publishes no API. The real clawback uses the rate on the day the dispute is created, which the prototype cannot know. On 5 Oct the real rate was ₹96.30, about 9% above the old placeholder.

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

**Deep dive 4 (6 Oct).** After you add or remove a document, a note right under the evidence card says "Your evidence changed" with a Re-run button (before, the only prompt was at the top of the right column, a full screen away on a phone, and that bar is gone). The old call is tagged "Out of date: re-run the check" and dimmed, and the review box warns before you submit on a stale check. The form now says what helps for the reason code (13.1 to 13.7), and on an Escalate call shows "The advisor asked for: <missing document>". The upload control is a styled button instead of the browser's file widget.

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

**Checklist and sources (6 Oct).** Each dispute's evidence card now has "What 13.x needs: 3 of 3 key documents in place", which opens to what usually decides that reason code and what helps, each line ticked with the documents that fill it or marked "Not yet. Goes in: <slot>" (`lib/evidenceChecklist.ts`, `components/EvidenceChecklist.tsx`). It reads the slot mapping from the last check, so new documents are placed after a re-run, and it says so. The requirements come from Visa's merchant dispute guide (June 2024, pages 37 to 47) and Razorpay's contest API, which also fixed the 11 slot names; each line says where it comes from when Visa's guide directly supports it. How it works now has a "Where the rules come from" section with the links and a table of the five rules checked against the guide, and `docs/RULE_CHECK.md` records the result: no rule was wrong, five nuances are not modelled.

## F2 · Policy profile ✅

**What it does.** On the Agent setup page the merchant writes their refund, cancellation and renewal terms once (up to 1,000 characters) and says how customers accept them: checkbox at checkout, email, footer link only, or not sure. Every new check (Re-run check, Add evidence) sends that text to the model.

**How it works.** The text goes into the request as `<merchant_policy accepted_by="...">`, with a line saying it is what the merchant says, not proof. Only evidence documents can prove what a customer saw or agreed to, so a footer-only policy does not turn a 13.7 dispute into a Fight (the C14 case). The text is capped and escaped like evidence, card numbers are rejected, and the cache key includes it. Setup is stored in this browser only.

**Limits.** The saved results shown on first load do not use it; only live checks do. Also on this page: approvals (locked on), notify choices (saved, nothing is sent), the reasons covered, and an on/off switch that pauses new checks.

---

## F3 · Cited response draft ✅

**Deep dive 2 (6 Oct).** After a submit or fold, a plain confirmation comes first ("You contested $1,200 of $1,200 with 4 documents. In the real app this goes to Razorpay and the bank decides.") and the request sits behind a "What would be sent" toggle. "Documents by slot" now names each document ("E1 Terms acceptance record") and clicking one highlights it. The submit and fold dialogs say "Simulated: nothing leaves this demo", and "Copy" reads "Copy response".

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

**Deep dive 6 (6 Oct).** Agent setup now has one save pattern: everything saves as you change it, in this browser, with a "Saved" status line (the Save button is gone; bad terms show "Not used yet"). A "Try it on a dispute" card links to C13. "What the agent can do" now also lists what it will never do. How it works: the five flow cards link to the screens where each step happens; the merchant content (flow, seven rules) comes first and the brief answers, assumption, scope and limits sit under "For reviewers" in two columns (page about 250px shorter).

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

**Deep dive 3 (6 Oct).** The order is now: due within 24 hours first, then the rest, Chargeback Shield last, biggest rupees first inside each group (C06 and C10 rise to the top block; before, C10 was last). On phones each dispute is a card (amount, time left, reason, call chip) instead of a sideways-scrolling table, and the three summary numbers sit in one row. A note says the 16 disputes are from 16 different demo businesses, and the footer says the calls are saved results so the list works without an API key.

**What it does.** `/disputes` lists every dispute so the merchant sees what needs a decision first.

- **Summary cards:** disputes needing a decision (fraud excluded), total at stake in ₹, and how many are due within 24 hours (orange when above zero).
- **Table:** dispute ID and merchant, amount (original currency and ₹), reason code with plain name, time left (⚠ and orange under 24 hours), call chip, status, and Details.
- **Order:** due within 24 hours first, then the rest, Chargeback Shield last; biggest rupees first inside each group.
- **Filter** by call (All, Fight, Fold, Escalate, Chargeback Shield).
- **Download CSV** of what is shown.
- **Status:** Open, or Contested / Folded (simulated) once you act.
- The whole row is clickable. On a phone the table scrolls sideways inside its card and the page does not.

---

**Start here and patterns (6 Oct).** The list opens with a "New here? Try these three" card for reviewers: C06 (a fight call), C15 (an escalate call) and C10 (a clear win). On a phone it folds to one line so the list stays on the first screen. Below the table, "What is causing your disputes" groups the 15 non-fraud demo disputes by reason code with the count, the rupees at stake, how many the advisor would fight, fold or escalate, and a prevention fix (`lib/patterns.ts`, tested). It answers the Grow half of the track. The fixes are tips written for the demo, not model output, and the card says so.

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

_6 Oct: the fixed-checklist baseline is now code (`lib/baseline.ts`), with 5 tests that reproduce all 20 stored checklist answers, so the comparison cannot be accused of a hand-picked loser. The page also says the builder chose the case types._

**What it does.** `/evals` compares the human answer key, the fixed checklist, the saved v1 ChatGPT run, the earlier Claude run and the latest automated run, case by case and against the PRD bars (launch, target, stretch). It covers 20 cases, including two messy ones (C17, C18) and two with instructions hidden in the evidence (C19, C20). C15 is highlighted. Every number is computed from the data files, and the limits are stated on the page.

**How it works.** `npm run eval` runs every case through the same code as the app (forced tool call, zod, safety rules) and writes `eval/results/<prompt>-<model>-<date>.json` and a summary. The page reads the newest file. It shows the model's own call and the call after the safety rules, so you can see what the rules fixed. Cases without a usable answer count as wrong.

**Today.** Tested against a stand-in model only; the v2.2 column says "No automated run yet" until a real run is committed. Never cut.

---

**Deep dive 5 (6 Oct).** The agent and the checklist are now compared on the same 15 cases (agent v1 15 of 15, checklist 8 of 15); the 4 newer cases (C17 to C20) have their own line because they have no saved agent run. Three headline tiles sit at the top, the C15 "case that matters most" callout sits above the tables, tier badges show only for agent columns, and the case table has short headers, a "Not run" marker and a footnote about the early Claude run. On a phone the Type and early-run columns are hidden and chips are compact so the table fits without sideways scroll, also when a latest automated run is present.

## Accessibility pass (deep dive 7, 6 Oct)

An audit of all pages found the copy clean (R1 to R7 and "prompt" appear only where the rules and the saved-result label need them) and a visible focus ring on every control. Fixed: helper grey and link blue darkened so text reaches 4.5:1 contrast (helper #6B6B6B, brand #2F63C8, hover #244FA3; this is slightly darker than Razorpay's own blue on purpose); a "Skip to content" link; the Under the hood drawer keeps Tab inside and returns focus to its button; tap areas on phones are at least 40px (filters, Download CSV, back link, citation chips, Under the hood, Safety checks), using padding or an invisible hit area so the look is unchanged. Tested by `e2e_a11y.py`.

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

---

## F11 · Results: how the product learns and how it is measured ✅

**Why it exists.** The brief asks "how does the system learn from the outcome" and "what business outcome would you measure". Before this, the answer was one sentence after Won or Lost. Now it is computed.

**What it does** (`/results`, `lib/results.ts`, `lib/ledger.ts`, `components/ResultsView.tsx`).
- Every Fold, and every Submit once you mark Won or Lost, is written to a small list in the browser (the "ledger"). Reset this demo on a dispute removes its entry.
- The page shows three numbers from the PRD: recovered per ₹ disputed (the North Star; fees are not included in the demo), win rate when fought, and answered on time.
- **By reason:** disputes, fights, wins, win-rate bar and ₹ recovered per reason code, with the weakest one named and its fix.
- **Was the advisor right?** Fight calls split by confidence, with the AI estimate (High 80%, Medium 55%) next to what actually happened; Fold calls that would have won (the merchant fought anyway); Escalate calls that were fought later.
- On each dispute's check panel, the line "Your record on 13.2: fought 6, won 5 (83%)" sits under the AI estimate.

**Sample history.** A first-time visitor has no outcomes, so `data/sample-history.json` holds 24 made-up past disputes, labelled "sample" and "not real data" on the page, with a checkbox to turn them off. The figures (76% won when fought, Medium-confidence Fight calls won 2 of 4) are authored, not measured. They show the mechanism, not a result.

**What it does not do.** Nothing is trained and the AI estimate is not changed by this history. In the real product the results would calibrate the estimate and set the launch thresholds; the page says so. Arbitration fees are not in the recovered figure.

**Tests.** `lib/results.test.ts` (11 tests) and `e2e_results.py`.

---

## F12 · Learning loop and why-AI proof ✅ (6 Oct)

Four additions that answer two questions in the challenge brief: "why AI, not a fixed rule" and "how does the system learn from the outcome".

- **Checklist vs agent, on every dispute.** The coded checklist (`lib/baseline.ts`) runs on the live evidence, including anything pasted or uploaded, and the box under "Missing / Contradictions" says whether it would give the same advice or a different one. Hidden for fraud codes. `lib/vsChecklist.ts`, 5 tests.
- **Odds that use your record.** `adjustOdds` in `lib/results.ts` blends the AI's estimate with how Fight calls at the same confidence were won, counting the AI's number as 10 past fights, so a few results barely move it and many take over. Only settled Fight calls count; this dispute is never counted against itself. The money check uses the adjusted odds, and the page says so. Sample history is part of the record and is labelled as such. 4 tests.
- **Misses become eval cases.** If the advisor said Fight and the dispute was lost, or said Fold and the merchant fought and won, the outcome panel offers "Download as eval case": a JSON file in the shape of `cases.json`, emails and long numbers masked, with a proposed label that a person must confirm before it goes into `data/labels.json`. Escalate is never a miss. `lib/missCase.ts`, 5 tests.
- **Release gate.** `releaseGate()` in `lib/eval.ts` checks every launch bar plus "all hidden instructions resisted". `npm run eval -- --gate` prints PASS or FAIL and exits with an error on FAIL. It is a command we run before changing the live prompt, not an automatic block on deploys. The bars and the loop are on How it works (`#learning`). 2 tests.

**Limits.** Outcomes live in the browser, so the loop is shown, not run across merchants. Per-confidence blending ignores reason code because there are too few results. Real learning would need stored outcomes per merchant and a review queue.

## Anonymous usage counter ✅ (optional)

**Why.** To see how reviewers used the demo (for the pitch), with no accounts and no personal data. A shared database of outcomes was rejected because anonymous judges would see each other's data; this stores counts only.

**What it does** (`lib/usage.ts`, `lib/track.ts`, `app/api/event`, `app/api/usage`, `/usage`).
- The browser sends one of 11 fixed event names (first visit, dispute opened with its demo ID, re-run, upload, submit, fold, outcome won or lost, and views of Results, Evals and How it works). The server only accepts names and IDs on its allowlist, rate-limits per IP, and caps the body at 200 characters. It adds one to today's count for that event in a Supabase table (`usage_counts`: day, event, count; set up with `docs/supabase-usage.sql`) through a database function, using the server-only service-role key, with row-level security on and no public access. It always answers 204 so the page never notices a failure.
- Nothing is stored about the person: no IP, cookie, name, email or evidence text. First visits are counted using a flag in the visitor's own browser. Nothing is sent when the browser says Do Not Track.
- With no database configured every call is a no-op and the app is unchanged.
- `/usage` asks for `USAGE_ADMIN_TOKEN`, keeps it in memory, and shows visitors, disputes opened, submits, folds, outcomes, the most opened disputes and the last 14 days. It is not linked from the tabs and is marked noindex. The API returns 404 when the token is not set.

**Tests.** `lib/usage.test.ts` (11 tests) and `e2e_usage.py` against a stand-in Supabase server (also checked: wrong key leaves the app working, no config is a no-op).

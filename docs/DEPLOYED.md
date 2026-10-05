# What is deployed

Live: https://isbx-razorpay-aditi.vercel.app/disputes
Last updated: 5 Oct 2026, after milestone 2. Update this file at the end of every milestone.

## Milestone 1: shell, list and detail on saved results

### 1. Page shell
- [x] Banner on every page: "Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product."
- [x] Black top bar (Ray AI, Payments, Banking+, Payroll, More), green glow under Payments, static search box
- [x] White sub-tabs (Transactions, Settlements, Disputes, Refunds). Only Disputes is a link; the rest are inert
- [x] `/` redirects to `/disputes`
- [x] Colour tokens and Inter font from `docs/design/DESIGN.md`; Inter is bundled in the repo; no Razorpay logo
- [x] Works at 390px with no sideways page scroll (nav and tabs scroll inside their own rows)

### 2. Dispute list (`/disputes`)
- [x] Summary cards: need a decision (excludes the fraud case), at stake in ₹ at the demo rate, due within 24 hours
- [x] Table of all 16 disputes: ID and merchant, amount (original currency plus ₹), reason code and plain name, time left, call chip, Details link
- [x] Sorted by ₹ amount against time left
- [x] Time left shows a warning icon and orange under 24 hours (4 disputes)
- [x] Call chips have icon and text (8 Fight, 5 Fold, 2 Escalate, 1 Chargeback Shield)
- [x] Footer note: calls are saved kill-test results; ₹ uses a fixed demo rate

### 3. Dispute detail (`/disputes/C01` to `/disputes/C16`)
- [x] Header card: ID, amount, network and reason, merchant, raised date, ₹ at the demo rate, time left
- [x] What the customer says; what the Visa rule means (plain words); what Razorpay knows
- [x] Evidence cards with IDs (E1...) and the evidence-slot tags from the saved result
- [x] Call chip, confidence, one-line reason, deciding-evidence chips that jump to the document, saved one-sentence draft (none for fraud or Fold cases)
- [x] Source label: "Saved result: ChatGPT 5.6 Terra, prompt v1"
- [x] Phone: the call shows before the case
- [x] Back link to the list

### 4. Data and engineering
- [x] 16 demo cases and saved results loaded from `data/`; calls come from the clean ChatGPT run, not the Claude run that knew the test design
- [x] Fixed demo exchange rate (₹88 per USD placeholder), labelled "demo rate"
- [x] All 20 pages prerendered; no server calls, no API key, no secrets
- [x] Deployed on Vercel from the public repo

## Milestone 2: check panel, safety rules and actions on saved results

### 5. Check panel (detail page, right column)
- [x] Call card: call chip, confidence, one-line reason, "Changed by safety rule: ..." note when a rule changed the call
- [x] Deciding-evidence chips: click scrolls to the document and highlights it
- [x] Missing evidence and contradictions lines (missing evidence is the model's own text from the saved result)
- [x] Money block: at stake, taken back if you lose, fees at risk (Visa arbitration USD 600), AI estimate of odds, "Fighting is worth it" or "Check the money" (C10 shows it); partial contest note (C15)
- [x] Safety checks R1 to R7 as pass / changed / blocked lines, collapsed with a count; unit-tested
- [x] Fraud (C16): shows the Chargeback Shield card, no actions
- [x] Escalate (C02, C15): "Get this first", a message to send with Copy, deadline line, and "No time to gather more" under 6 hours
- [x] Thumbs up or down on the call

### 6. Review and submit (Fight)
- [x] Editable draft with a live 1,000-character counter and a copy button
- [x] Sources by sentence: citation chips, red underline on a sentence with no source ("Add a source or remove this sentence"), chips highlight the document
- [x] Documents by slot list; contest amount field (pre-filled with the defensible part on C15, capped at the full amount)
- [x] Submit is blocked, with the reason shown, when a sentence has no source, the draft is over 1,000 characters, there is no draft or there is no document
- [x] Approve and submit opens a confirm dialog (closes on Escape); then shows the exact simulated `PATCH /v1/disputes/{id}/contest` request

### 7. Fold, override and outcome
- [x] Fold confirm dialog with the rupee amount, then the simulated `POST /v1/disputes/{id}/accept` request
- [x] Choosing against the call asks for an optional reason, logged as an override
- [x] Status timeline; demo Won / Lost toggle; Fold shows "Lost (accepted)"
- [x] "What the agent learns" line, "Next time" prevention tip, and after a loss or Fold two next steps worded as things to confirm (bank, accountant)
- [x] "Reset this demo" clears the dispute's demo state

### 8. Under the hood drawer and list upgrades
- [x] Drawer: saved result with model, prompt version and date; safety checks; raw saved output; audit trail of your actions
- [x] List: rows are clickable, filter by call, Download CSV, status column (Contested / Folded, simulated)
- [x] Demo actions persist in this browser only (localStorage); the app works if storage is blocked

### What is not real in M2
- Odds are set from the saved confidence (High 80%, Medium 55%) because the saved v1 results have no estimate. The defensible amount, the escalate message and the prevention tips come from `data/prerun/demo-supplements.json`, written by the builder, not the model. A live check (M3) returns these itself.
- Tokens, response time and cost in the drawer say "once the live check is on".
- Nothing is sent to Razorpay; every request is shown, not sent.

## Not deployed yet
- [ ] M3: Add evidence, Re-run check, live Claude call, API route with rate limit and caps; draft contest on Escalate (FR-23b)
- [ ] M4: evals page and `npm run eval`
- [ ] M5: how-it-works page, agent setup page, copy and accessibility pass
- [ ] M6: product note, video, final public build log

## Known gaps against the spec (`docs/pm/04-screens.md`)
- Pasted evidence can't be added yet and nothing can be re-run (M3)
- Escalate cases can't save a draft contest (M3)
- The "How can I help you next?" numbered prompts from the Ray-style answer are not built
- Call and money numbers for saved results use placeholder odds (see above)
- The ₹ amounts use a placeholder rate; the real rate and its source are still to be chosen

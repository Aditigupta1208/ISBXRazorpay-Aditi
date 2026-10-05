# What is deployed

Live: https://isbx-razorpay-aditi.vercel.app/disputes
Last updated: 5 Oct 2026, after milestone 1 (commit 81e11a0). Update this file at the end of every milestone.

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

## Not deployed yet
- [ ] M2: money block, safety rules R1 to R7, editable draft with counter, citation chips, Approve / Fold / Escalate with simulated request and confirm dialog, outcome and next steps, "Under the hood" drawer
- [ ] M3: Add evidence, Re-run check, live Claude call, API route with rate limit and caps
- [ ] M4: evals page and `npm run eval`
- [ ] M5: how-it-works page, agent setup page, copy and accessibility pass
- [ ] M6: product note, video, final public build log

## Known gaps against the spec (`docs/pm/04-screens.md`)
- Clicking a list row does nothing; only the Details link opens a dispute
- No filters, download button or status column on the list
- Deciding-evidence chips jump to the document but do not highlight it
- Fold has no explanation until M2
- A fraud case shows an evidence slot tag although no check runs on it
- The ₹ amounts use a placeholder rate; the real rate and its source are still to be chosen

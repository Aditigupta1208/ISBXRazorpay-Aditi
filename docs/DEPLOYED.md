# What is deployed

Live: https://isbx-razorpay-aditi.vercel.app/disputes
Last updated: 6 Oct 2026, after the deep dives and the extra features below. Update this file at the end of every milestone.

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
- [x] Live USD/INR rate (ECB via frankfurter.dev, cached 12 h), labelled "live rate" with the date; falls back to ₹88 "demo rate"; optional pin with `FX_RATE_INR_PER_USD`
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

## Milestone 3: live check

### 9. Add evidence and Re-run check
- [x] "+ Add evidence": title (80 characters) and pasted text (4,000, with counter), up to 5 per dispute; next ID; Remove link; card numbers blocked
- [x] "Evidence changed. Re-run check" bar; Re-run check button; progress text ("Reading N documents…", "Applying Visa rule…", "Writing the response…"); previous result dimmed while it runs
- [x] A live result replaces the saved one: call, reason, odds, money, safety lines, draft, slots and flags all update; it persists after reload
- [x] Failure handling: no key or error with no new evidence shows the saved result and a notice; with new evidence shows "We couldn't run the check. Decide manually."
- [x] Fraud disputes show no Re-run or Add evidence

### 10. Server
- [x] `POST /api/analyze`: rate limit (20 per IP per hour), 60 KB request cap, input validation, fraud routing before any model call, cache by request, forced tool call, zod validation, one retry, 45 s timeout, 2,000 output tokens
- [x] Prompt read from `prompts/dispute-agent-v2.2.md` (single source); a test keeps the zod schema and the prompt's tool schema in step
- [x] Evidence wrapped and escaped against prompt injection
- [x] Under the hood shows live tokens, response time, cost in USD and ₹, and cache hits
- [x] API key read only on the server

### What is tested and what is not
- Tested: 35 unit tests (safety rules, money maths, request building, retry, fallbacks, cache, rate limit, injection escaping, schema match) and a browser test of the whole live flow against a stand-in server that mimics Anthropic's API, plus a no-key run.
- **Not tested: a real call to the Claude API.** It needs an API key. Until then the deployed app shows saved results and says "Decide manually" when evidence is added.

## Milestones 4, 5 and 5b, deep dives 1 to 7, and later additions (built and pushed 6 Oct)
- [x] Evals page, `npm run eval`, 30 cases (4 for messy evidence and hidden instructions, 10 unseen test cases); Agent setup (terms sent as the merchant's claim); How it works; demo script
- [x] Numbered next-step prompts, clear-win lane, PDF and image upload, draft contest on Escalate (prompt v2.2)
- [x] Deep dives on the check panel, review and submit, disputes list, Add evidence, Evals, Agent setup, How it works, and an accessibility pass (contrast, skip link, drawer focus, 40px tap targets)
- [x] Live USD/INR rate (ECB via frankfurter.dev, cached 12 h, labelled with its date), fallback to the ₹88 demo values, optional pin
- [x] "New here? Try these three" card and a "What is causing your disputes" section on the list
- [x] Results tab: ledger of what the merchant did, recovered per ₹, win rate, on-time, calibration, 24 labelled sample past disputes, and "your record" beside the AI estimate
- [x] Per-reason evidence checklist, rules checked against Visa's merchant guide and Razorpay's API, sources on How it works (`docs/RULE_CHECK.md`)
- [x] Optional anonymous usage counter (below)

### Optional settings (all can stay empty; the app works without them)
| Variable | What it does |
|---|---|
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Turns on the live check, upload and Escalate drafts. Without them the saved results show |
| `FX_RATE_INR_PER_USD` | Pins the USD rate (labelled "fixed rate") so the video, note and demo agree |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Anonymous usage counts. Added automatically by the Vercel Supabase integration. Run `docs/supabase-usage.sql` once in the Supabase SQL Editor to create the table. Server-only; never use a `NEXT_PUBLIC_` name |
| `USAGE_ADMIN_TOKEN` | A long random string. Lets you read the counts at `/usage` (not linked anywhere, not indexed) |

The counter stores only counts per fixed event name and per demo dispute ID, no names, emails, IPs, cookies or evidence text, and counts nothing if the browser sends Do Not Track. How it works says so to visitors.

## Not deployed yet
- [ ] Real-model run of the C06 demo, a PDF and a screenshot (needs the API key)
- [ ] A real v2.2 run of `npm run eval` (needs the API key)
- [ ] M6: product note, video, final public build log
- Cut from the MVP: PDF and image upload; draft contest on Escalate; clear-win fast lane (F7) unless time allows

## Known gaps against the spec (`docs/pm/04-screens.md`)
- No extracted key facts per document (FR-15, a P0 in the PRD; needs the model)
- Saved results are from the ChatGPT v1 kill test; odds on them come from confidence. After the real run they should be regenerated from Claude with prompt v2.2
- Only the first dispute stage is modelled (no pre-arbitration or arbitration)
- Not proven on the real model: the live check, upload, Escalate drafts, the forced tool call on Sonnet 5.5, `maxDuration`, and the first real `npm run eval`
- The live rate fetch and the usage counter were tested against stand-in servers only (the real Supabase table needs the SQL run once)
- The Results sample history is made up and labelled so

Full feature descriptions: `docs/FEATURES.md`.

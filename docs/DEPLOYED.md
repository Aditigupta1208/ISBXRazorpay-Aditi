# What is deployed

Live: https://isbx-razorpay-aditi.vercel.app/disputes
Last updated: 9 Oct 2026, after the live model on Groq and the three AI helpers (section 11 below). Update this file at the end of every milestone.

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
- A real call to the Claude API was not tested (see section 11 for what ran on real Groq models).

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
| `GROQ_API_KEY` | Turns on the live check on Groq (free plan, fast). Text only: text PDFs are read by code (no AI), scanned PDFs and images fall back to paste. The model order is in code (`GROQ_MODEL_ORDER`) |
| `GROQ_MODEL`, `GROQ_FALLBACK_MODELS` | Optional overrides of that order (one name, and a comma-separated list). Leave empty |
| `GROQ_REASONING` | `low`, `medium` or `high`. Only the `gpt-oss` models use it; higher is steadier and slower and uses more of the free allowance |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `LLM_PROVIDER` | Same, on Google Gemini (free tier works). An Anthropic key wins if both are set; `LLM_PROVIDER` forces one. Free tier may use inputs to improve Google products, so made-up data only |
| `FX_RATE_INR_PER_USD` | Pins the USD rate (labelled "fixed rate") so the video, note and demo agree |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Anonymous usage counts. Added automatically by the Vercel Supabase integration. Run `docs/supabase-usage.sql` once in the Supabase SQL Editor to create the table. Server-only; never use a `NEXT_PUBLIC_` name |
| `USAGE_ADMIN_TOKEN` | A long random string. Lets you read the counts at `/usage` (not linked anywhere, not indexed) |

The counter stores only counts per fixed event name and per demo dispute ID, no names, emails, IPs, cookies or evidence text, and counts nothing if the browser sends Do Not Track. How it works says so to visitors.

## Milestone 7: live on a free model, helpers and hardening (8 to 9 Oct)

### 11. What the live check runs on
- [x] **Free Groq models by default.** The order is set in code (`GROQ_MODEL_ORDER` in `lib/groq.ts`): `qwen/qwen3.8-27b`, then `openai/gpt-oss-120b`, then `openai/gpt-oss-20b`. Every result says which model answered ("Live: qwen/qwen3.8-27b, prompt v2.2") and "Under the hood" says which model was tried first and why it did not answer (rate limit, too slow, too large, not available)
- [x] Backups: a short rate limit (6 s or less) is waited out on the same model; a "request too large" is retried once with less room; otherwise the next model answers; a model that just failed is tried last for 60 s; if none answers, the saved result shows with a plain note
- [x] An Anthropic key, if set, wins over Groq; `LLM_PROVIDER` forces one. Claude has not been run live
- [x] The free plan has per-minute and daily token limits shared by every visitor. Under heavy use the app falls back to saved results and says so (tour, How it works, failure messages)
- [x] Real-model checks against the answer key: Qwen matched C01 Fight, C06 Fight, C08 Fold and C15 Escalate (C15 twice). `gpt-oss-120b` at high thinking matched C01, C06 and C08 but said Fight on C15
- [x] `/api/llm-status`: provider, model, backups, which key variable is read, deployment and commit, thinking level; `?probe=1` makes one tiny real call; `?models=1` lists the model names the key can use

### 12. Helpers (each one: AI proposes, code checks, merchant decides)
- [x] **Shorten**: a draft over 1,000 characters gets a shorter version that must keep a source on every sentence and add no number; the merchant picks it or keeps theirs
- [x] **Key facts**: two to three lines per document, each backed by a quote that must appear word for word in the document, with matching numbers
- [x] **What to change next** (Results): one suggestion from your outcomes, every number in it checked against your record
- [x] **Bank's rebuttal**: a practice run that names the bank's strongest objection, the weakest sentence (a partial quote of one draft sentence is accepted), and a cited rewrite or the one document to add. Never changes the call
- [x] If a draft has sentences with no source, the model is asked once to fix them before the merchant sees it
- [x] The dates in the case are listed to the model oldest first, worked out by code

### 13. Add evidence
- [x] Adding or removing a document re-runs the check by itself and scrolls to the new answer; a banner shows the old call, an arrow and the new call, and the document that decided it is tagged "Decided the call"
- [x] A text PDF is read by code on the server (no AI); a scanned PDF or an image on Groq says "paste the text instead"

### 14. Eval script
- [x] `npm run eval` runs one case at a time with a pause on Groq or Gemini, and records the model that really answered (a mixed-model run says so). **Not run on a real model yet**

## Not deployed yet
- [ ] A real v2.2 run of `npm run eval` on all 30 cases (run on your own machine, after the daily allowance resets)
- [ ] Claude as the live model (needs an Anthropic key and about $5 to $10 of credit)
- [ ] Saved results regenerated from the live model (they are still ChatGPT v1)
- [ ] M6: product note, video, final public build log
- [ ] Safari and Firefox, a real iPhone, the Supabase usage table

## Known gaps against the spec (`docs/pm/04-screens.md`)
- Saved results are from the ChatGPT v1 kill test; odds on them come from confidence. They show whenever the live model is unavailable; regenerating them from the live model with prompt v2.2 is optional
- Only the first dispute stage is modelled (no pre-arbitration or arbitration)
- Proven on real Groq models: the live check, add evidence, Bank's rebuttal, Key facts, Shorten and text PDF upload. Not proven: Claude as a provider, a scanned PDF or image (not supported on Groq), and the first real `npm run eval`
- The live rate fetch and the usage counter were tested against stand-in servers only (the real Supabase table needs the SQL run once)
- The Results sample history is made up and labelled so

Full feature descriptions: `docs/FEATURES.md`.

# Build plan

About 2 hours a day. One milestone per session. The app must be deployable at the end of every milestone.
Look and feel: `docs/design/DESIGN.md` (mock in `docs/design/mock/`). Screens: `docs/pm/04-screens.md`. Data flow and stack: `docs/pm/05-data-and-stack.md`. Requirements: `docs/pm/03-prd.md`.

Plan: PM work finished 5 Oct. Build 6 to 10 Oct. Note, video and submission 11 to 13 Oct.

## M1: Skeleton, data and list (6 Oct)

- [x] Next.js (App Router, TypeScript) + Tailwind project, `.gitignore` covering `node_modules`, `.next`, `.env*`
- [x] Tailwind colour tokens and Inter font from `docs/design/DESIGN.md`
- [x] `lib/data.ts` loads `data/cases.json`, `data/labels.json` and the saved runs in `data/prerun/`, with TypeScript types
- [x] Layout: prototype banner "Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product.", black top bar (Ray AI, Payments, Banking+, Payroll, More, search), white sub-tabs (Transactions, Settlements, Disputes, Refunds). Only Disputes works; other tabs are inert. Works at 390px width.
- [x] `/disputes` list as in `docs/pm/04-screens.md`: three summary cards, table with call chips from the saved ChatGPT v1 run (the clean run), time left
- [x] `/disputes/[id]` showing dispute facts, Razorpay facts and evidence cards (check panel can be a placeholder)
- [x] `npm run build` passes
- [x] Deployed to Vercel: https://isbx-razorpay-aditi.vercel.app/disputes

Done when: a stranger can open the public URL and click through all 16 disputes.

## M2: Check panel, safety rules and actions on saved results (7 Oct)

- [x] Check panel built from the saved result: call card, confidence, reason, Visa rule, deciding evidence (click highlights the card), slot mapping, money block, editable draft with a 1,000-character counter and citation chips
- [x] `lib/guardrails.ts` with R1 to R7 (see `docs/pm/05-data-and-stack.md`) and `lib/money.ts` (formula, one fixed demo rate labelled "demo rate", fees with source URL and date); both run on saved results and are unit-tested
- [x] Actions: Approve and submit, Fold, Escalate, each with a confirm dialog and the simulated request panel ("Simulated: not sent to Razorpay"); partial contest when `defensible_amount` is set
- [ ] Draft contest on Escalate (FR-23b): moved to M3, because the saved v1 Escalate results have no draft to save
- [x] Outcome and next steps: Won/Lost toggle, "what the agent learns" line, 2 to 3 next steps, prevention tip
- [x] "Under the hood" drawer: result source, model, prompt version, safety checks, raw JSON

- [x] Also done: clickable list rows, call filter, CSV download, status column (from the M1 gap list)

Done when (checked in a browser test): C04 (Fight), C14 (Fold), C15 (Escalate) and C16 (Chargeback Shield) each work end to end.

## M3: Live check (8 Oct; needs the API key)

Before starting: create the API key in the Claude Console, set a spend limit, add `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` to `.env.local` and to Vercel. Confirm the model ID on the models page. Day-1 test: a real PDF and a screenshot as evidence.

- [x] `lib/schema.ts` (zod) and `lib/agent.ts`: builds the request from `prompts/dispute-agent-v2.1.md`, wraps each item as `<evidence id="E1">` with the closing tag escaped, forced tool call `record_dispute_decision`, validates with zod, retries once, falls back to the saved result
- [x] `POST /api/analyze` (server only): per-IP rate limit, 4,000-character cap per pasted item, ~4 MB file cap, Luhn block, fraud codes routed before any model call, 45 s timeout, result cache by request hash
- [x] "Re-run check" and "Add evidence" trigger a live call; the panel, money block and safety lines update; progress text under the button
- [x] Under the hood shows live tokens, time and cost (`lib/pricing.ts`, source URL and date in a comment)
- [x] Works with no key (saved results, labelled "Saved result: <model>, prompt <version>")

- [ ] Run the C06 demo, a PDF and a screenshot on the REAL model (needs your API key). Tested so far against a stand-in server that mimics the API
- [ ] Confirm Vercel `maxDuration` and the forced tool call on Sonnet 5.5
- Cut from the MVP: PDF and image upload (needs the real-model test); draft contest on Escalate (the prompt writes drafts only for Fight)

Done when: on C06, pasting "Billing audit log, 30 Jul 2026: customer clicked Cancel subscription" as new evidence changes the call and the safety lines update.

## M4: Evals (9 Oct)

- [x] Add messy cases (long, partly contradictory evidence) and 2 prompt-injection cases to the eval set; label them in `data/labels.json` (this is the one place the build plan allows editing `data/`)
- [x] `scripts/eval.ts` (`npm run eval`): runs all cases through `lib/agent.ts`, compares with `data/labels.json`, writes `eval/results/<prompt>-<model>-<date>.json` and a markdown summary
- [x] Metrics: decision accuracy (overall, checklist-friendly, needs-judgment), deciding-evidence overlap, citation pass rate, safety-rule triggers, fraud routing, injection resisted, average cost and time
- [x] `/evals` page: metric cards and per-case table (Label, Checklist, ChatGPT v1 saved, Claude run saved, Claude v2.1 latest); C15 highlighted; limits stated; thresholds from the PRD (launch, target, stretch)
- [ ] (needs your API key) Run once with prompt v2.1 and commit the results file

Built and tested against a stand-in server (the fake run was not committed). `/evals` shows "No automated run yet" for v2.1 until the key exists. C17 to C20 have no saved v1 run.

Done when: `/evals` shows the v1 manual results and one automated v2.1 run side by side.

## M5: Explain and polish (10 Oct)

- [x] `/how-it-works` page: flow (dispute record + evidence → prompt v2.1 → Claude API → safety rules → merchant approval → outcome), the seven Track 2 answers, assumption A1 (overlap with Dispute Responder), out of scope, limitations
- [x] `/agent-studio` setup page (terms and how customers accept them are sent into each check as data; approvals locked on; on/off switch) as in `docs/pm/04-screens.md`
- [x] README: what it is, live link, how to run locally, architecture, where the eval data lives, disclaimer
- [ ] Copy pass on every screen; keyboard and focus check; fix rough edges (360px checked on the new pages; the rest comes with the feature deep dive)
- [x] Update `docs/DEMO_SCRIPT.md`: the 90-second path from `docs/pm/04-screens.md` (C04, C06, C15, C16, evals)

## M5b: Cuts brought back (6 Oct, decided by you)

- [x] Numbered next-step prompts on each dispute, in the style of Ray's "How can I help you next?" (2 to 3 options that act on this dispute; no key needed)
- [x] Clear-win lane (F7): a banner on a high-confidence Fight whose draft rests on Razorpay's own record, offering a one-click review (no key needed)
- [x] (built, tested on a stand-in model only) PDF and image upload in Add evidence. Design: the file is read once into text by the model, the merchant checks and edits that text, then it is ordinary evidence (so every existing cap and the injection wrapper still apply and no file is stored). **NOT counted as proven until tested on a real PDF and a real screenshot with the key**

- [x] (built, tested on a stand-in model only) Draft contest on Escalate (FR-23b): prompt v2.2 writes a draft from the evidence on hand when the call is Escalate (never claiming what the missing document would show). v2.1 is kept as the baseline. Saved results have no such draft, so it shows on live checks only. **Needs a real run to see whether the model stays within the evidence**

## M6: Note, video, submit (11 to 13 Oct)

- [ ] 11 Oct: one-page product note (problem, merchant, what was left out, how AI was used, Track 2 answers, metrics)
- [ ] 12 Oct: record and edit the video (90 seconds or less); final public AI build log
- [ ] 13 Oct: fix anything broken, re-run `npm run eval` only if the prompt changed, submit before 11:59 PM IST using the form link in the brief

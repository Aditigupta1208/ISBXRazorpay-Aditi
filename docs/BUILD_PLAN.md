# Build plan

About 2 hours a day. One milestone per session. The app must be deployable at the end of every milestone.
Look and feel: `docs/design/DESIGN.md` (mock in `docs/design/mock/`). Screens: `docs/pm/04-screens.md`. Data flow and stack: `docs/pm/05-data-and-stack.md`. Requirements: `docs/pm/03-prd.md`.

Plan: PM work finished 5 Oct. Build 6 to 10 Oct. Note, video and submission 11 to 13 Oct.

## M1: Skeleton, data and list (6 Oct)

- [ ] Next.js (App Router, TypeScript) + Tailwind project, `.gitignore` covering `node_modules`, `.next`, `.env*`
- [ ] Tailwind colour tokens and Inter font from `docs/design/DESIGN.md`
- [ ] `lib/data.ts` loads `data/cases.json`, `data/labels.json` and the saved runs in `data/prerun/`, with TypeScript types
- [ ] Layout: prototype banner "Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product.", black top bar (Ray AI, Payments, Banking+, Payroll, More, search), white sub-tabs (Transactions, Settlements, Disputes, Refunds). Only Disputes works; other tabs are inert. Works at 390px width.
- [ ] `/disputes` list as in `docs/pm/04-screens.md`: three summary cards, table with call chips from the saved Claude run, time left
- [ ] `/disputes/[id]` showing dispute facts, Razorpay facts and evidence cards (check panel can be a placeholder)
- [ ] `npm run build` passes; deployed to Vercel with a public URL

Done when: a stranger can open the public URL and click through all 16 disputes.

## M2: Check panel, safety rules and actions on saved results (7 Oct)

- [ ] Check panel built from the saved result: call card, confidence, reason, Visa rule, deciding evidence (click highlights the card), slot mapping, money block, editable draft with a 1,000-character counter and citation chips
- [ ] `lib/guardrails.ts` with R1 to R7 (see `docs/pm/05-data-and-stack.md`) and `lib/money.ts` (formula, one fixed demo rate labelled "demo rate", fees with source URL and date); both run on saved results and are unit-tested
- [ ] Actions: Approve and submit, Fold, Escalate, each with a confirm dialog and the simulated request panel ("Simulated: not sent to Razorpay"); partial contest when `defensible_amount` is set; draft contest on Escalate
- [ ] Outcome and next steps: Won/Lost toggle, "what the agent learns" line, 2 to 3 next steps, prevention tip
- [ ] "Under the hood" drawer: result source, model, prompt version, safety checks, raw JSON

Done when: C04 (Fight), C14 (Fold), C15 (Escalate) and C16 (Chargeback Shield) each work end to end.

## M3: Live check (8 Oct; needs the API key)

Before starting: create the API key in the Claude Console, set a spend limit, add `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` to `.env.local` and to Vercel. Confirm the model ID on the models page. Day-1 test: a real PDF and a screenshot as evidence.

- [ ] `lib/schema.ts` (zod) and `lib/agent.ts`: builds the request from `prompts/dispute-agent-v2.1.md`, wraps each item as `<evidence id="E1">` with the closing tag escaped, forced tool call `record_dispute_decision`, validates with zod, retries once, falls back to the saved result
- [ ] `POST /api/analyze` (server only): per-IP rate limit, 4,000-character cap per pasted item, ~4 MB file cap, Luhn block, fraud codes routed before any model call, 45 s timeout, result cache by request hash
- [ ] "Re-run check" and "Add evidence" trigger a live call; the panel, money block and safety lines update; progress text under the button
- [ ] Under the hood shows live tokens, time and cost (`lib/pricing.ts`, source URL and date in a comment)
- [ ] Works with no key (saved results, labelled "Saved result: <model>, prompt <version>")

Done when: on C06, pasting "Billing audit log, 30 Jul 2026: customer clicked Cancel subscription" as new evidence changes the call and the safety lines update.

## M4: Evals (9 Oct)

- [ ] Add messy cases (long, partly contradictory evidence) and 2 prompt-injection cases to the eval set; label them in `data/labels.json` (this is the one place the build plan allows editing `data/`)
- [ ] `scripts/eval.ts` (`npm run eval`): runs all cases through `lib/agent.ts`, compares with `data/labels.json`, writes `eval/results/<prompt>-<model>-<date>.json` and a markdown summary
- [ ] Metrics: decision accuracy (overall, checklist-friendly, needs-judgment), deciding-evidence overlap, citation pass rate, safety-rule triggers, fraud routing, injection resisted, average cost and time
- [ ] `/evals` page: metric cards and per-case table (Label, Checklist, ChatGPT v1 saved, Claude run saved, Claude v2.1 latest); C15 highlighted; limits stated; thresholds from the PRD (launch, target, stretch)
- [ ] Run once with prompt v2.1 and commit the results file

Done when: `/evals` shows the v1 manual results and one automated v2.1 run side by side.

## M5: Explain and polish (10 Oct)

- [ ] `/how-it-works` page: flow (dispute record + evidence → prompt v2.1 → Claude API → safety rules → merchant approval → outcome), the seven Track 2 answers, assumption A1 (overlap with Dispute Responder), out of scope, limitations
- [ ] `/agent-studio` setup page as in `docs/pm/04-screens.md`
- [ ] README: what it is, live link, how to run locally, architecture, where the eval data lives, disclaimer
- [ ] Copy pass on every screen; check at 360px; keyboard and focus check; fix rough edges
- [ ] Update `docs/DEMO_SCRIPT.md`: the 90-second path from `docs/pm/04-screens.md` (C04, C06, C15, C16, evals)

## M6: Note, video, submit (11 to 13 Oct)

- [ ] 11 Oct: one-page product note (problem, merchant, what was left out, how AI was used, Track 2 answers, metrics)
- [ ] 12 Oct: record and edit the video (90 seconds or less); final public AI build log
- [ ] 13 Oct: fix anything broken, re-run `npm run eval` only if the prompt changed, submit before 11:59 PM IST using the form link in the brief

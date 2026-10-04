# Build plan

About 2 hours a day. One milestone per session. The app must be deployable at the end of every milestone.

## M1: Skeleton, data and inbox (5 Oct)

- [ ] Next.js (App Router, TypeScript) + Tailwind project, `.gitignore` covering `node_modules`, `.next`, `.env*`
- [ ] `lib/data.ts` loads `data/cases.json`, `data/labels.json` and the saved runs in `data/prerun/`, with TypeScript types
- [ ] Layout: left sidebar (Home, Transactions, Disputes, Agent Studio), top banner "Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product."
- [ ] `/disputes` inbox as described in `docs/PRODUCT.md`, using the saved ChatGPT run for verdict chips
- [ ] `/disputes/[id]` showing dispute facts, Razorpay facts and evidence documents (agent panel can be a placeholder)
- [ ] `npm run build` passes; deployed to Vercel with a public URL

Done when: a stranger can open the public URL and click through all 16 disputes.

## M2: Agent panel, guardrails and actions with saved results (6 Oct)

- [ ] Agent panel fully built from the saved result (decision, confidence, reason, rule, deciding evidence with highlight, slot mapping, editable draft with 1,000-character counter)
- [ ] `lib/guardrails.ts` implementing all six checks from `docs/PRODUCT.md`, run on the saved results too, shown as pass/fail lines
- [ ] Actions: Approve and submit, Accept, Escalate, each showing the Razorpay API request it would send (simulated)
- [ ] Outcome screen with Won/Lost toggle, "what the agent learns" line and a prevention tip
- [ ] "Under the hood" drawer (for saved results show model, prompt version, date and raw JSON)

Done when: C04 (Fight), C14 (Accept), C15 (Escalate) and C16 (route to fraud cover) each work end to end.

## M3: Live agent (7 Oct; needs the API key)

Before starting: create the API key in the Claude Console, set a spend limit, add `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` to `.env.local` and to Vercel.

- [ ] `lib/agent.ts`: builds the prompt from `prompts/dispute-agent-v2.md`, calls the Claude API with a forced tool call matching the schema, validates with zod, retries once, falls back to the saved result
- [ ] Route handler `POST /api/analyze` (server only) with rate limiting and a 4,000-character cap on added evidence
- [ ] "Re-run agent" and "Add evidence" trigger a live call; the panel and guardrails update
- [ ] Under the hood shows live tokens, response time and cost (constants in `lib/pricing.ts`, with the source URL and date in a comment; INR rate as a labelled assumption)
- [ ] Works with no key (falls back to saved results, clearly labelled)

Done when: on C06, pasting "Billing audit log, 30 Jul 2026: customer clicked Cancel subscription" as new evidence makes the agent change its answer, and the guardrail lines update.

## M4: Evals (8 Oct)

- [ ] `scripts/eval.ts` (`npm run eval`): runs all 16 cases through `lib/agent.ts`, compares with `data/labels.json`, writes `eval/results/<prompt>-<model>-<date>.json` and a markdown summary
- [ ] Metrics: decision accuracy (overall, checklist-friendly, needs-judgment), deciding-evidence overlap, citation-check pass rate, guardrail triggers, fraud routing, average cost and latency
- [ ] `/evals` page: metric cards plus a per-case table with columns Label, Checklist, ChatGPT v1 (saved), Claude run (saved), Claude v2 (latest automated run); C15 highlighted; limits stated
- [ ] Run the eval once with prompt v2 and commit the results file

Done when: `/evals` shows the v1 manual results and one automated v2 run side by side.

## M5: Explain and polish (9 Oct)

- [ ] `/how-it-works` page: flow diagram (dispute record + evidence → prompt v2 → Claude API → guardrails → merchant approval → outcome), the seven Track 2 answers, out of scope, limitations
- [ ] README: what it is, live link, how to run locally, architecture, where the eval data lives, disclaimer
- [ ] Copy pass on every screen; check phone width; fix visual rough edges

## M6: Buffer and demo script (10 Oct)

- [ ] Fix anything broken; re-run `npm run eval` if the prompt changed
- [ ] Write `docs/DEMO_SCRIPT.md`: a 90-second click path (inbox → C04 Fight → C15 Escalate → add evidence on C06 → Evals)

# Dispute Decision Agent: build instructions for Claude Code

Concept prototype for the Razorpay x ISB AI PM Build Challenge (Track 2: Recover and Grow with AI).
Submission deadline: 13 Oct 2026, 11:59 PM IST. Builder works about 2 hours a day, so keep every session focused on one milestone.

## What we are building (one paragraph)

An Agent Studio-style agent for Indian businesses that sell to international customers. When a card dispute arrives for a **non-fraud** reason (service not provided, cancelled subscription, not as described, refund not processed, cancelled service), the agent reads Razorpay's dispute record plus evidence the merchant has (contracts, login logs, emails, vouchers), applies Visa's rules for that reason code, recommends **Fight / Accept / Escalate**, and drafts a response in which every sentence cites a document. Fraud reason codes are routed to Razorpay Chargeback Shield. The merchant always approves. Full product context: `docs/PRODUCT.md`.

## Read before working

1. `docs/PRODUCT.md`: problem, merchant, features, what is out of scope.
2. `docs/BUILD_PLAN.md`: milestones in order, with the definition of done for each. Work on the current milestone only.
3. `prompts/dispute-agent-v2.md`: the agent prompt and output schema the app must use.
4. `data/`: demo cases, the human answer key, and saved model outputs from the kill test. Do not edit these files except where the build plan says so.

## Stack

- Next.js (App Router) with TypeScript, Tailwind CSS
- `@anthropic-ai/sdk` for the Claude API, called only from server code (route handlers / server actions)
- `zod` for validating the model's output
- No database. Demo actions (approve, accept, outcome) are kept in client state or localStorage.
- Deploy on Vercel (free tier). The repo is public.

## Hard rules

- **Never commit secrets.** The API key lives only in `.env.local` (git-ignored) and in Vercel's environment variables. Never send it to the browser.
- **The app must work with no API key.** If `ANTHROPIC_API_KEY` is missing or a call fails, use the saved result for that case from `data/prerun/` and label it "Saved result" with the model and prompt version.
- **Model ID comes from `ANTHROPIC_MODEL`.** Use the current Claude Sonnet model. Confirm the exact model ID at https://platform.claude.com/docs/en/about-claude/models/overview before hard-coding a default.
- **Structured output only.** Get the agent's answer through a forced tool call (tool_choice set to the tool) whose input schema matches the schema in `prompts/dispute-agent-v2.md`, then validate with zod. Retry once on invalid output, then fall back to the saved result.
- **Guardrails run in code after every model answer** (see `docs/PRODUCT.md`, "Guardrails"). Show their results in the UI.
- **Protect the API budget.** Rate-limit the analyse route (for example 20 calls per IP per hour), cap pasted evidence at 4,000 characters, and set `max_tokens` sensibly.
- **Label the app clearly:** "Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product." Do not use Razorpay's logo. A Razorpay-dashboard-like layout and blue accent are fine.
- Keep the scope in `docs/PRODUCT.md`. If something is listed as out of scope, do not build it.
- Write short, plain UI copy. Use the merchant's words (dispute, evidence, deadline), not internal jargon.

## Commands (set these up in milestone 1)

- `npm run dev`: local dev server
- `npm run build`: production build (must pass before every push)
- `npm run eval`: run all 16 cases through the agent and write results to `eval/results/` (milestone 4)

## How to work each session

1. Read `docs/BUILD_PLAN.md` and pick the first milestone that is not done.
2. Plan briefly, then build only that milestone.
3. Run `npm run build` and fix errors.
4. Tick the milestone's checklist in `docs/BUILD_PLAN.md`, commit with a clear message, and push.
5. Append one line to `docs/SESSION_LOG.md`: date, milestone, what was built, anything decided or cut.

# Compact instructions

When compacting, keep: the current milestone, files changed, open bugs, and decisions made this session.

# Dispute Advisor

Concept prototype for the **Razorpay x ISB AI PM Build Challenge** (Track 2: Recover and Grow with AI).
Not an official Razorpay product.

An Agent Studio-style agent for Indian businesses selling services, subscriptions, travel or digital goods to international card customers. For a **non-fraud** card dispute, the **Fold-or-Fight check** reads the merchant's own evidence, applies Visa's rule, recommends Fight, Fold (accept) or Escalate with the money maths, and drafts a response that cites a document in every sentence. The merchant always approves.

- Product thinking: [`docs/pm/`](docs/pm/) (discovery, features, PRD, screens, data and stack)
- Look and feel: [`docs/design/DESIGN.md`](docs/design/DESIGN.md), mock in [`docs/design/mock/`](docs/design/mock/)
- Product summary: [`docs/PRODUCT.md`](docs/PRODUCT.md)
- Build plan: [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md)
- Feature guide (what each feature does): [`docs/FEATURES.md`](docs/FEATURES.md)
- What is deployed so far: [`docs/DEPLOYED.md`](docs/DEPLOYED.md)
- Live prototype: https://isbx-razorpay-aditi.vercel.app/disputes
- Evaluation so far: [`eval/kill-test-v1.md`](eval/kill-test-v1.md)
- Prompts: [`prompts/`](prompts/) (current: v2.2; v2.1 is the baseline)
- Demo data: [`data/`](data/)

Status: M1 to M5 built (M3 and M4 live parts wait for an API key). Submission 13 Oct 2026.

## Run it locally

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY or GEMINI_API_KEY to turn on the live check
npm run dev                  # http://localhost:3000
npm test                     # unit tests
npm run build                # production build
npm run eval                 # runs every case through the live agent; needs the API key
```

With no API key the app shows the saved results and says so. The key is read only on the server and is never sent to the browser.

## How it is built

Next.js (App Router) and TypeScript. The agent prompt and its tool schema live in `prompts/dispute-agent-v2.2.md` and are read from there. `lib/agent.ts` makes one forced tool call to Claude, validates the answer with zod, retries once, then falls back to the saved result. `lib/guardrails.ts` runs the seven safety rules in code after every answer. Evidence is wrapped as data and never followed as instructions.

## Where the evaluation lives

- `data/cases.json`, `data/labels.json`: 30 cases and the answer key (C17 to C20 are messy and prompt-injection cases; C21 to C30 are unseen test cases for the rules comparison, with answers proposed by the builder's AI assistant and not yet confirmed)
- `data/prerun/`: saved v1 runs
- `eval/results/`: automated runs from `npm run eval` (none yet until the key exists)
- `/evals` in the app shows all of it side by side

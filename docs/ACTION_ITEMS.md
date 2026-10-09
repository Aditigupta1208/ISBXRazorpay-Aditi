# Action items (9 Oct 2026, evening)

Deadline: 13 Oct 2026, 11:59 PM IST. Freeze 10 Oct (tag `submission`). Everything is on `main`. The full product evaluation is `docs/PRODUCT_EVAL.md`.

## You

| Item | When |
|---|---|
| Check `/api/llm-status` on the production site (commit `91d8eea` or later). Vercel env: `LLM_PROVIDER=groq`, `GROQ_MODEL` and `GROQ_FALLBACK_MODELS` empty | before freeze |
| Run `docs/supabase-usage.sql` in Supabase and set `USAGE_ADMIN_TOKEN` if you want `/usage` | before freeze |
| Confirm the C23 and C21 to C30 answers in the key | before freeze |
| Pin `FX_RATE_INR_PER_USD` | 12 Oct |
| Check on a real iPhone, Safari and Firefox | before freeze |
| Choose the Escalate colour (red now; amber or purple are options) | before freeze |
| One-page note | 11 Oct |
| 90-second video | 12 Oct |
| Merchant conversations (none yet) | any time |

## Me

Done 9 Oct: audit P1 to P3, 30-case live eval, prompt v2.3, no-key message, saved Fold odds, repeat-sentence check, readable C06 headline, key facts for eight cases, charts on Results and Evals, reset on the list, breadcrumb alignment.

Left, only if time: another live eval run after the freeze fixes (do not tune on C15, C18, C23); more saved cases.

## Backlog to build together (agreed 9 Oct; nothing here is built)

Ordered by how many of the three merchants asked for it.

| # | Item | Asked by | Notes |
|---|---|---|---|
| 1 | Alerts as the front door: Slack or WhatsApp preview with a channel choice, and "Your rules" (alert above an amount, always alert for chosen reasons, digest for the rest, fold-suggestion threshold). Preview only; nothing sent | 3 of 3 | Merges earlier items 2 and 8 |
| 2 | Evidence packet export: cover summary, contents, numbered exhibits | 3 of 3 | Print-ready; code only |
| 3 | Lead with the named gap on every call; make "Chance to win" smaller and labelled; show customer history (earlier disputes) from the Razorpay facts | 3 of 3 | Small UI change |
| 4 | "Check these before you approve": each amount, date and count in the draft with its source document | 3 of 3 | Code only |
| 5 | New code check: every number and date in a draft appears in a cited document or in the dispute record | 3 of 3 | Defends the "one wrong fact" trust-killer. Add after item 4 |
| 6 | Rule R8: a Fight with no key document becomes Escalate | A, C stories | Frozen in `docs/HELDOUT_TEST.md`; build after the held-out labels |
| 7 | Policy patch (checkout wording, usage emails, milestone approvals, "export logs before access ends") | all three changed their process | Code template first; model rewrite optional |
| 8 | Dispute ratio tile on Results from numbers the merchant types in | A, C | Verify the thresholds first |
| 9 | "Will never" list: add refund and accept-for-you | 3 of 3 | Copy change |
| 10 | "Copy a summary to send to a colleague" | C | Small |
| 11 | What-if evidence, with a deadline check on "Get this first" | B | Code only |
| 12 | Held-out run: your labels for C31 to C40, then one run on prompt v2.3 | n/a | Waiting on you |

Facts checked 9 Oct (see `docs/MERCHANT_FINDINGS.md`): a submitted contest cannot be added to (draft first, then submit), so do not suggest "submit now, mark pending". The ratio is counted when a dispute is raised (secondary sources); Razorpay's own thresholds are not public. Ask merchant C for his warning email and ask Razorpay support for their limit before putting a ratio tile or any ratio advice in the product.

## Waiting on you

- Next merchant calls: run the prototype test (Part 3 of `docs/MERCHANT_CONVERSATIONS.md`). The accepted-or-lost follow-up is done for all three.

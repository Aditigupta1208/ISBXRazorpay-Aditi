# Product: Dispute Advisor

Short summary for the build. The full thinking is in `docs/pm/` (start with `03-prd.md`).

## The problem

Indian businesses that sell to international customers (SaaS companies, agencies, consultants, inbound tour operators) get card disputes they rarely know how to handle.

- A merchant gets **3 business days** to respond to a chargeback. If they don't, the dispute is treated as accepted. (Razorpay chargeback guide; Razorpay Curlec help article)
- Cross-border payments carry **roughly twice the chargeback rate** of domestic payments, and a lost international dispute is taken back **at the exchange rate on the day the dispute was created**, so a weaker rupee can make the loss larger than the original payment. (Razorpay blog, Aug 2026)
- **Nearly half** of small-business merchants don't respond to chargebacks at all. (Antom, Jul 2025)
- Razorpay **Chargeback Shield** covers fraud-coded chargebacks on international payments, but its terms **exclude** disputes about "the quality, delivery, or description of goods or services". (Chargeback Shield terms)
- For those non-fraud disputes, the evidence that wins lives **outside Razorpay**: signed scopes of work, login and usage logs, terms-acceptance records, emails, booking vouchers. (Razorpay blog, Aug 2026; Visa Dispute Management Guidelines)

Liability for chargebacks rests with the merchant, card-network fines are passed on, and Razorpay may suspend service for excessive disputes (Razorpay terms).

## The merchant

Primary: an Indian SaaS or digital-services company billing US, UK and EU customers by card through Razorpay. Secondary: service exporters paid via Payment Links, and inbound travel operators.

## What the agent does

When a non-fraud dispute arrives, the agent:

1. Reads Razorpay's dispute record (reason code, amount, deadline) and payment facts (refunds, 3-D Secure, earlier payments).
2. Reads the evidence the merchant has, from wherever it lives (uploaded or pasted documents).
3. Applies Visa's rule for that reason code.
4. Runs the **Fold-or-Fight check**: recommends **Fight**, **Fold** (accept) or **Escalate**, with confidence, the deciding evidence, any contradictions, and what is missing.
5. Weighs whether fighting is worth it: `p × A > (1 − p) × F + E` (amount, rupee amount taken back, fees at risk, AI estimate of the odds, effort cost).
6. Maps each document to Razorpay's evidence slots and drafts the response (max 1,000 characters, Razorpay's limit; can cover part of the amount), with a citation on every sentence.
7. **Bank's rebuttal (optional, on a click):** before the merchant approves, a second AI pass plays the cardholder's bank, names the strongest objection and the weakest sentence, and offers a one-click rewrite or the one document to add. It is a simulation and never changes the call.
8. Waits for the merchant to approve, edit, accept or escalate.
9. On Escalate it also says what finding the missing document is worth (**Worth finding?**: a ceiling, `(1 − odds) × amount`, not a forecast). With 24 hours left, **Deadline rescue** nudges the merchant with the response already drafted and a link that opens it for review (preview only in the prototype).
10. Records the outcome, lists next steps (accountant, bank paperwork) and suggests one prevention fix after a loss.

Three small helpers use the same rule, **the AI proposes, code checks, the merchant decides**:

- **Shorten**: a draft over 1,000 characters is shortened, keeping a source on every sentence and adding no number.
- **Key facts**: two or three lines per document, each backed by a quote that must appear word for word in it.
- **What to change next** (Results): one suggestion from the merchant's own outcomes, with every number checked against their record.

Adding or removing a document re-runs the check by itself and shows what changed.

Fraud reason codes (10.x) are routed to Chargeback Shield.

## What runs the live check

A free Groq model by default (Qwen first, with `gpt-oss-120b` and `gpt-oss-20b` as backups, order set in code), or Claude when an Anthropic key is set. The free plan has limits shared by every visitor, so under heavy use the app shows the saved result and says so. Every result names the model that answered. Text PDFs are read by code; scanned PDFs and images need Claude or pasted text. Real-model check against the answer key: Qwen matched C01, C06, C08 and C15 (see `docs/DEPLOYED.md`, section 11). Full 30-case run on the live chain (9 Oct 2026, prompt v2.2, run by GitHub Actions): 83% agreement with the human answer (24 of 29 scored), checklist 55%; 63% on needs-judgment cases; all hidden-instruction cases resisted; fraud case routed. 24 answers came from the `gpt-oss-120b` backup because Qwen's account limit is 1,000 output tokens a minute. The weak spot is Escalate: none of the 4 Escalate cases (C02, C15, C18, C23) was called right. Below the launch bar, shown as such on the Evals page.

## Screens

Layout follows Razorpay's Agentic Dashboard: black top bar, white sub-tabs (Transactions, Settlements, Disputes, Refunds), white cards on a light grey page. See `docs/design/DESIGN.md` and `docs/pm/04-screens.md`.

1. **Disputes inbox**: open disputes with amount, reason (code plus plain name), time left to respond (red under 24 hours), and the call chip (Fight, Fold, Escalate or Chargeback Shield). A summary strip: how many need a decision, total at stake, how many are due within 24 hours.
2. **Dispute case view**:
   - Left: dispute facts, the customer's claim, what Razorpay knows.
   - Middle: evidence documents (E1, E2...) and an **Add evidence** box (paste text, give it a title). New documents get the next ID and the agent can re-run.
   - Right: the agent panel: decision chip, confidence, a plain-language reason, the Visa rule applied, deciding evidence (clicking an ID highlights the document), contradictions and missing evidence, economics note, evidence-slot mapping, the draft (editable, with a character counter out of 1,000), guardrail check results, and actions.
   - **Actions**: Approve and submit, Fold (accept), Escalate / request a document, Re-run check. Submitting or folding is simulated and shows the exact Razorpay request (`PATCH /v1/disputes/{id}/contest` with `action`, optional `amount`, `summary` and evidence slots, or `POST /v1/disputes/{id}/accept`), labelled "Simulated: not sent to Razorpay".
   - **Under the hood** drawer: saved result or live call, model, prompt version, input and output tokens, response time, cost for this dispute (USD and INR), and the raw JSON.
3. **Outcome and next steps**: mark the dispute Won or Lost (demo). Show what the agent learns ("reason 13.2 with cancellation_proof + access_activity_log: won"), 2 to 3 next steps ("ask your accountant about...", never tax advice as fact) and one prevention tip.
4. **Evals** (includes 2 prompt-injection cases): the kill-test results. AI vs a fixed checklist vs the human answer key, per case and in total, plus later automated runs of prompt v2. Highlight case C15 (see below). State the limits honestly.
5. **How it works**: a simple flow diagram, the brief's seven Track 2 questions answered, what is out of scope, and limitations.

## Guardrails (run in code after every model answer)

1. **Schema check**: the answer must match the schema in `prompts/dispute-agent-v2.md` (zod). Invalid: retry once, then fall back to the saved result.
2. **Citation check**: every sentence of the draft must end with at least one citation like `[E2]` or `[Razorpay]`, and every cited ID must exist in the case. If a live draft has sentences with no source, the model is asked once to fix them. Any failure left is flagged in red and blocks "Approve and submit" until the merchant edits the draft.
3. **Evidence check**: every ID in `deciding_evidence` must exist in the case ("Razorpay" counts, for Razorpay's own record); otherwise the call becomes Escalate.
4. **Decision policy**: Fight with low confidence, or Fight while `missing_evidence` is not empty, is downgraded to Escalate and labelled "Changed by safety rule".
5. **Scope rule**: any fraud reason code (10.x) is forced to "Route to fraud cover" before any model call.
6. **Length**: the draft must be 1,000 characters or less.
7. **Card numbers**: a full card number (Luhn check) in pasted evidence is rejected.

Show each check as a pass, changed or blocked line in the check panel (rule numbers R1 to R7 match `docs/pm/05-data-and-stack.md`).

Bank's rebuttal has four more checks of its own, RB1 to RB4 (the quoted sentence is in the draft; a rewrite cites real documents; a rewrite fits 1,000 characters; only documents in this dispute are named). They only remove something unsafe and are shown under the result.

## Evidence that this needs AI (the kill test, 4 Oct 2026)

16 cases patterned on public sources (Visa's dispute guidelines, Razorpay blogs, public merchant stories), labelled by the builder from Visa's rules.

| | Result |
|---|---|
| AI (ChatGPT 5.6, fresh chat, prompt v1) | 15/15 decisions right; 7/7 on checklist-friendly cases, 8/8 on cases needing judgment |
| Fixed checklist (sees only which documents exist) | 8/15 |
| Right deciding evidence | 15/15 |
| Invented facts in drafts | 0 of 8 (checked by a separate model) |
| Fraud case routed to Chargeback Shield | Yes |

**C15 example:** a reviewer prompt that only applied Visa's rules said "Accept" on a USD 3,200 group-tour dispute, which would have refunded USD 1,600 the merchant's accepted policy did not owe. The product prompt said "Escalate: confirm the canceller's authority; a 50% refund is likely due."

**Limits:** the cases are short and cleanly written, there are only 15 scored cases, and the model was given Visa's rules. This shows the AI applies the rules to written evidence and knows when to escalate or route; it does not prove real-world win rates.

## Out of scope (say so in the product note)

Fraud disputes (Chargeback Shield covers them), pre-dispute alerts, live Razorpay API calls (requests are shown, not sent), connectors to booking or product systems (v1 takes pasted or uploaded evidence), contacting customers, arbitration, login and multi-merchant support, mobile app.

## Track 2 questions, answered

| Brief asks | Answer |
|---|---|
| What data or signal | Razorpay dispute record and payment facts, plus merchant evidence |
| Why AI over a fixed rule | Reads unstructured evidence, judges relevance, catches contradictions, knows when to escalate; kill test 15/15 vs 8/15 |
| What action | Fight / Fold / Escalate / route, evidence-slot mapping, cited draft |
| What the merchant controls | Edit, approve, fold, escalate; nothing is submitted without approval |
| How it learns | Won and lost outcomes plus merchant edits, by reason code and evidence type |
| Accuracy, trust, failure | Guardrails above, saved-result fallback, audit trail, personal data kept minimal |
| Business outcome | INR recovered per INR disputed (after exchange-rate effects), share answered before the deadline, time to respond, win rate on contested disputes, repeat disputes after prevention fixes |

## Sources

- Razorpay chargeback guide: https://razorpay.com/blog/chargebacks/
- Razorpay international chargebacks guide (Aug 2026): https://razorpay.com/blog/international-payment-chargebacks-for-indian-businesses-how-to-win-prevent-and-handle-them
- Chargeback Shield terms: https://razorpay.com/terms/chargeback-shield/
- Razorpay disputes API (contest): https://razorpay.com/docs/api/disputes/contest/
- Razorpay disputes API (accept): https://razorpay.com/docs/api/disputes/accept/
- Razorpay terms: https://razorpay.com/terms/
- Visa Dispute Management Guidelines: https://usa.visa.com/content/dam/VCOM/global/support-legal/documents/merchants-dispute-management-guidelines.pdf
- Antom Copilot chargeback assistant: https://fintechnews.sg/114081/ai/ant-international-antom-copilot-ai-upgrade/
- Razorpay Agent Studio: https://razorpay.com/agent-studio/

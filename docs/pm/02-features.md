# Features: Dispute Advisor

Stage 2 of the product work. Builds on `docs/pm/01-discovery.md` (core pains PP1–PP3, headline pain PP2; core solutions S1, S2, S13, S3).

## Name

**Dispute Advisor**, an Agent Studio agent. It follows Razorpay's object + role naming (Dispute Responder, Cashflow Forecaster, Chargeback Shield) and "Advisor" signals that it recommends while the merchant decides. Its star feature is the **Fold-or-Fight check**.

---

## ⭐ USP: Fold-or-Fight check

For any non-fraud dispute, Dispute Advisor reads the evidence the merchant actually has and tells them whether to **Fight**, **Fold** (accept the dispute and let the money go) or **Escalate** (get one more thing first), with reasons, the money maths and every claim cited.

**What the check contains**
1. **The rule in plain words:** what the customer claims, and what Visa says wins for this reason code.
2. **The evidence check:** which documents prove what, what contradicts what, and what is missing.
3. **The money maths:** amount at stake, exchange-rate clawback if lost, fees, and the AI's estimate of the odds.
4. **The call:** Fight / Fold / Escalate, with confidence and a one-line reason.

"Fold" maps to Razorpay's accept-dispute action (`POST /v1/disputes/{id}/accept`).

**Why this is the USP**
- Solves the headline pain (PP2, "is it worth fighting?") and PP1; both are shared by all three merchant personas.
- It is the part a checklist cannot do: kill test 15/15 vs checklist 8/15 (`eval/kill-test-v1.md`).
- No Indian player offers it: Chargeback Shield and PayU Fraud Liability Protect cover fraud only; Justt offers expected-return decisions to large global merchants, not Razorpay merchants.
- Best demo moment: on case C06, adding one document ("customer clicked Cancel on 30 Jul") flips the call from Fight to Fold.

---

## Supporting features (MVP)

| # | Feature | What it does | Pain | MVP |
|---|---|---|---|---|
| F1 | **Evidence locker** | Paste or upload documents; AI extracts facts, flags contradictions, shows what's missing, maps each item to Razorpay's 11 evidence slots | PP3 | Yes |
| F2 | **Policy profile** | Merchant uploads refund and cancellation policy and terms once; reused in every check | PP1, PP2 | Yes |
| F3 | **Cited response draft** | Response written for the reason code, max 1,000 characters, every sentence cited; code verifies each citation | PP4 | Yes |
| F4 | **Merchant controls** | Edit, approve and submit, fold, or escalate; nothing is sent without approval | Trust | Yes |
| F5 | **Safety checks** | Schema check, citation check, no Fight on low confidence or missing evidence, fraud codes routed to Chargeback Shield, sensitive-data block | Trust | Yes |
| F6 | **Priority inbox** | Disputes ranked by money at stake × time left, with a Fight/Fold/Escalate chip on each | PP5 | Yes |
| F7 | **Clear-win fast lane** | Disputes settled by Razorpay's own data (e.g. refund already issued) get a one-click response, still approved | PP2, PP4 | Yes (first to cut) |
| F8 | **Outcome, next steps and prevention tip** | After a result: what the agent learned, one fix (e.g. click-to-accept on renewal terms), and two "next steps" lines for a lost or accepted international dispute: ask your bank about reducing the export value (Razorpay must supply the documents under RBI's payment aggregator rules), and ask your accountant whether a GST credit note applies. Worded as questions to confirm, not advice | PP7 | Yes (second to cut) |
| F9 | **Under the hood / audit trail** | Model, prompt version, cost per dispute, raw output; every action logged | Trust | Yes |
| F10 | **Evals page** | Kill-test results (AI vs checklist vs answer key) plus automated reruns | Proves "why AI" | Yes (never cut) |

**Cut order if time runs short:** F7, then F8. F10 stays.

---

## 🚀 Moonshot: Service Dispute Shield

Razorpay extends Chargeback Shield to non-fraud disputes. When the Fold-or-Fight check says **Fight** with high confidence and complete evidence, Razorpay guarantees the amount: the merchant is paid even if the bank rules against them, for a fee per covered dispute.

**Why it's credible**
- Razorpay already takes 100% liability on fraud disputes for a fee ([Chargeback Shield](https://razorpay.com/chargeback-shield/)).
- PayU launched fraud liability cover in Sep 2026 ([MediaNama](https://www.medianama.com/2026/09/223-payu-ai-fraud-protection-cross-border-card-payments/)).
- Every Fold-or-Fight check, with its evidence and outcome, becomes underwriting data.

**Caveats built in**
1. **Moral hazard:** cover only when the call is Fight, confidence is high and evidence is complete; per-merchant limits; exclude merchants above Visa's early-warning dispute ratio.
2. **Service disputes are fuzzier than fraud:** start with reasons a policy or log usually decides (13.2 cancelled subscription, 13.6 refund not processed, 13.7 cancelled service).
3. **Needs months of outcome data first;** hence a moonshot, not the MVP.

---

## Deprioritised

| Feature | Why not now |
|---|---|
| Connectors (helpdesk, Gmail, product analytics) | Integration work; uploads cover v1 for every merchant. **v2** |
| WhatsApp approval of calls | Agent Studio already escalates to WhatsApp. **v2** |
| Network win-odds model | Needs Razorpay outcome data; simulated in the prototype only |
| Fully automatic filing | Irreversible money decisions; against Agent Studio's approval design |
| Pre-dispute outreach | No public pre-dispute signal |
| Human expert service | Doesn't scale; no AI |
| Static playbooks | The checklist our kill test beat |
| Fraud, UPI and physical-goods disputes | Covered elsewhere or a different process |

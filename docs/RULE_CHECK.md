# Rule check: the five Visa rules and the 11 Razorpay slots against published sources

Checked 6 Oct 2026. Result: no rule was wrong; five nuances recorded below. The rules in `data/labels.json` and `prompts/dispute-agent-v2.2.md` were written first from public guides, then compared with these sources. The prompt was not changed, because no real-model run exists yet to compare against.

## Sources
- Visa, *Dispute Management Guidelines for Visa Merchants*, June 2024, pages 37 to 47: https://usa.visa.com/content/dam/VCOM/global/support-legal/documents/merchants-dispute-management-guidelines.pdf
- Razorpay, Contest a dispute (API): https://razorpay.com/docs/api/disputes/contest/
- Razorpay, international chargebacks for Indian businesses: https://razorpay.com/blog/international-payment-chargebacks-for-indian-businesses-how-to-win-prevent-and-handle-them
- Third-party guides (Chargeflow, Chargeback Gurus) were used only as a cross-check, not as the source of any rule.

## Rules
| Code | Visa guide | Result | Nuance not modelled |
|---|---|---|---|
| 13.1 | p. 37 | Matches: proof the cardholder or an authorised person received it | Delivery date not yet passed; customer cancelled before delivery |
| 13.2 | p. 39 | Matches: proof the customer used the service after withdrawing permission | Processing the credit as a remedy |
| 13.3 | p. 40 | Matches: invoice, contract or similar that answers the claim | Neutral third-party opinion on quality; accepted repair or replacement |
| 13.6 | p. 45 | Matches: credit already processed, or sale valid and no credit due | None found |
| 13.7 | p. 46 to 47 | Matches: policy disclosed and agreed at the time of sale; online means click-to-accept | The prompt says "only if"; the guide also allows a credit already given and other answers. Kept narrow on purpose |

## Razorpay slots
The 11 slot names (`shipping_proof`, `billing_proof`, `cancellation_proof`, `customer_communication`, `proof_of_service`, `explanation_letter`, `refund_confirmation`, `access_activity_log`, `refund_cancellation_policy`, `term_and_conditions`, `others`) match the contest API exactly. A unit test checks that the prompt's slot list equals this set. The API also confirms: `summary` up to 1,000 characters, `amount` defaults to the full amount, `action` is `draft` or `submit`, and a submit needs at least one document.

## Other facts
- Visa arbitration filing fee USD 600 from 1 April 2025 (Razorpay's page). The app labels it as a cited value.
- Razorpay's response windows: first stage T+3 business days, pre-arbitration T+2, arbitration T+1. The demo uses hours left and the first stage only.

## Known limits
- The Visa guide is the June 2024 edition; a newer edition may differ.
- The per-reason checklist (`lib/evidenceChecklist.ts`) maps each requirement to Razorpay slots. The mapping is our reading. Lines that Visa's guide directly supports say so in their text ("Visa lets you...", "Visa asks for...") and carry `src: "visa"` in the code; the others are our judgment. It is a checklist, not a guarantee.

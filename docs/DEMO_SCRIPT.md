# Demo script: 90-second video

Path from `docs/pm/04-screens.md` section 4. Record on the deployed app with the API key set, so the C06 step runs live. Practise once with a stopwatch; the numbers below are a target, not a promise.

Before recording: open the app in a fresh browser window (clean saved state) at desktop width, check "Reset this demo" on C04, C06, C15. Make sure Agent setup shows "Dispute Advisor is on".

| Sec | Screen | Say (short) | Do |
|---|---|---|---|
| 0 to 10 | `/disputes` | "Indian merchants lose card disputes because proving a non-fraud dispute is slow. Every dispute here already has a call, and what is due within 24 hours comes first." | Show the list, point at the call chips and the red "time left". |
| 10 to 35 | C04 | "Fight. It names the Visa rule, the two documents that decide it, and the money maths. Every sentence of the draft cites a document." | Click a deciding-evidence ID so the document highlights. Open Review your response, then Approve and submit. Point at "Simulated: not sent to Razorpay". |
| 35 to 55 | C06 | "New evidence changes the call." | Add evidence: title "Billing audit log", text "30 Jul 2026: customer clicked Cancel subscription". Re-run check. Call flips to Fold; safety lines update. |
| 55 to 70 | C15 | "Not everything is a fight. Here it says Escalate: USD 3,200 at stake, only half is owed, and one document is missing." | Show the Escalate card and what to get first. |
| 70 to 80 | C16 | "Fraud goes to Chargeback Shield. The agent does not touch it." | Open C16, show the routing card. |
| 80 to 90 | `/evals` | "On our test cases the agent matched the human answer where a fixed checklist missed. It also says what the numbers do not prove." | Show the table and the limits. Say the v2.2 result only if the real run is done; otherwise use the saved v1 numbers and say they are v1. |

Spare cases for live demos: C14 (Fold, policy only in the footer) and C10 (clear win). C17 to C20 are eval-only: they are not in the disputes list and show only on the Evals page.

Do not say: that anything is sent to Razorpay, that the win rates are real, or that the exchange rate is live.

# Merchant conversations: findings (9 Oct 2026)

Three conversations by the builder, using the question set in `docs/MERCHANT_CONVERSATIONS.md`, plus a short follow-up round on a dispute each had accepted or lost (the prototype test is still to run). Names and businesses are removed. The transcripts are held by the builder, not in this repo. n = 3, so these are signals that shaped choices, not evidence of how most merchants behave.

| | Merchant A | Merchant B | Merchant C |
|---|---|---|---|
| Business | One-person SaaS app for online-store owners (Bengaluru), US, UK and Australian customers | Small skincare brand (Kochi), about 30% international | Six-person marketing agency (Gurugram), US and Singapore clients |
| Fits the target segment (services, subscriptions, digital goods)? | Yes | No (physical goods, a different gateway) | Yes |
| Last dispute | "Service not received", USD 149, 47 logins in 3 months | "Merchandise not received", USD 85, delivered with signature | "Services not rendered", USD 2,400, 4 months of approved work |
| Window to respond | 3 business days | 7 days | 3 business days |
| Hardest evidence | IP and device log held by the cloud host | Signed proof of delivery held by the courier | Ad-account access history and WhatsApp chat |
| Time spent | About 18 hours over 2 days | About 2 days | About 2 days |
| Outcome | Won in about 25 days | Won in about 30 days | Won in about 25 days |

## What they said, and what it means for the product

| What we heard | What it supports or changes | Status |
|---|---|---|
| All three: the evidence that wins sits in a third party's system (cloud host, courier, ad platform, WhatsApp) and takes the time. | The "Get this first" message, the per-reason evidence checklist, and the "key documents in place" count are aimed at the right problem. | Built |
| All three asked for the packet or template to be built for them. A: "Auto-compile the evidence packet... 80% done." C: "Pre-built evidence template... reinventing the wheel." | A one-click evidence packet: cover summary, contents list and numbered exhibits E1, E2, as both A and C made by hand. | Proposed, not built |
| A and C: 3 business days, with a meeting or sprint interrupted. | Deadline rescue (a message with the response already drafted) is aimed at a real moment. Whether they would act on a WhatsApp message was not asked. | Built as preview; ask in the next round |
| A: "$5 and $500 hit the same way", no alert by amount. | An amount threshold on Deadline rescue and on the list. | Proposed, small |
| A and C accept small, no-usage disputes without looking (under USD 20, under USD 200). | The money check and Fold are what they do by hand today. This supports Fold as a first-class call. | Built |
| B: reason codes are bare numbers and had to be googled. | Plain-English reason names beside the code. | Built |
| C: no assigning, no internal notes, no history of similar disputes. A Google Sheet is used instead. | Team features are out of scope. History is partly covered by Results. | Not built, named as next |
| After the dispute they changed checkout and process: 3D Secure, a terms tick box, a monthly usage summary email, milestone approvals, photos of sealed packages. | This is what the prevention tip and the proposed policy patch should suggest, in the merchant's own terms. A's monthly usage email ("that email is gold") and C's milestone approvals are the strongest. | Tips built; policy patch proposed |

## Follow-up round: a dispute they accepted or lost

| Merchant | What happened | What it supports |
|---|---|---|
| A | **Accepted** a USD 12 renewal dispute: zero logins in 60 days and no pre-renewal reminder sent. "For twelve dollars, I'm not spending three days pulling logs." | Fold on a small, no-usage dispute is what he does by hand. It also points to a prevention fix: a renewal reminder. |
| A | **Lost** a USD 99 "unauthorized" dispute without responding: he was travelling, missed the 3-day deadline and it closed as a loss, although he had 3D Secure and login logs. He now sends a webhook to Slack. | The strongest evidence for Deadline rescue: a winnable dispute lost to the clock, not to the evidence. Note the reason was "unauthorized", a fraud-type reason that this prototype routes to Chargeback Shield, so the point is about the deadline, not the call. The channel that worked for him was Slack, not WhatsApp. |
| B | **Lost** a USD 120 goods dispute: "delivered" but no name or signature ("delivered to reception"), and the bank sided with the customer. Now requires a signature and photographs every box. Outside the target segment (physical goods). | Proof that exists only if it is captured before the dispute, so thin evidence loses. Supports the thin-evidence rule and the idea of proof at checkout. |
| C | **Accepted** a USD 450 "services not rendered" dispute because the agency failed: a staff member left, two weeks of work were missed, "we had access logs but no real deliverables". The client left. | Fold is right when the merchant's own record admits the problem. Access logs alone are not enough, which is the thin-evidence case. The loss of the client is a cost the money line does not show. |

## Round 3: how they would use it (questions on alerts, trust, Fold and why they fight)

| What we heard | Who | What it means for the product |
|---|---|---|
| The way in is an alert, not a tab. A and C want Slack, B wants WhatsApp (or a call for a big one). "Nobody clicks tabs." Email is ignored. | A, B, C | Deadline rescue is the front door, not a side feature. It needs a channel choice (Slack or WhatsApp). The dashboard entry alone will not be opened. |
| Alert rules are by amount and by reason, not one cutoff: A, over USD 50 or any fraud-type reason, else a daily digest; B, everything (2 to 3 a month); C, over USD 1,000, plus "services not rendered" always. | A, B, C | A small "Your rules" panel: alert above an amount, always alert for chosen reasons, digest for the rest. |
| A Fold has to name the missing document or the rule, not a probability. A: "the reason has to name the missing document... the gap." B: "tell me the rule." C: "'confidence: low' is a black box. I've seen enough dashboards with made-up percentages." | A, B, C | The Fold and Escalate reasons are right to name documents. The large "Chance to win" figure is the weak point: lead with the named gap and keep the estimate small and labelled. Do not invent statistics like "12% win rate". But A also decides by odds ("give me 30%, I'll spend a day"), so keep the number, smaller. |
| What they check before approving a draft: transaction ID and amount, dates, any number in it (A: "47 logins, I'll verify"), the tracking number (B), SOW scope, whether the logs cover the month and the approval email (C). | A, B, C | A short "Check these before you approve" list built by code from the draft: each amount, date and count, with the document it came from. |
| One wrong fact (a date, a name, an amount), slowness (4 seconds), long paragraphs ("three lines"), or an unasked refund ends their trust. | A, B, C | Supports the code checks. A new code check that every number and date in a draft appears in a cited document or in the dispute record would be the most direct defence. |
| Never send, never contact the customer, never refund, and never accept for me. C: "Don't accept on my behalf. Ever." | A, B, C | Matches the design. The "will never do" list should say refund and accept explicitly. |
| Thin evidence stories: A, support email in personal Gmail and logs kept only 90 days; C, client revoked ad-account access so the logs were gone, email reports alone lost; B, no signature. | A, B, C | Evidence expires or is never captured. Prevention tips and the policy patch should say "export logs before access ends" and "keep the approval emails in one place". |
| "Get this document first": yes if it takes a day. If it cannot arrive in time they would submit what they have and say the rest is pending (A, B), or ask the client to restore access for 24 hours (C). B: "tell me if it is even worth getting." | A, B, C | Worth asking already answers B. "Get this first" should check the deadline, and offer "submit now, mark this pending" only after we confirm Razorpay accepts a contest that is later added to. Not confirmed. B says a sent response cannot be changed. |
| Why they fight: A and C, to protect their record and ratio; B, precedent (it happened once, with a repeat customer, and she now checks a customer's history first). All three: if they expect to lose, they fold, because losing does not protect the record. | A, B, C | The Fold call matches how they already think. Show customer history (the Razorpay facts already hold "earlier disputes") on the card. |
| None of them can see their dispute ratio. A: "If there was a number on my dashboard I'd check it weekly." C: "I'm estimating." C once got a warning email. | A, C | A ratio tile in Results from numbers the merchant types in (card payments last month and disputes). The thresholds must be verified before any number is stated. |
| They fold or fight by personal thresholds: A, 30% chance is worth a day; B, about INR 5,000; C, fold under USD 200, fight over USD 2,000. | A, B, C | "Your rules" can include a fight threshold: below it the advisor suggests Fold (suggests only). |
| C forwards the message to his operations manager before approving. | C | A "copy a summary to send to a colleague" button. |

A to-do on facts: A and C believe a lost dispute raises their ratio. Earlier research (build log) found that winning does not lower it, because the dispute counts when it is raised. Check this against Razorpay and the card network before the advisor says anything about it.

## What the conversations still do not test

- The prototype test (Part 3) has not been run with any of them.
- They answered about a described message, not the product. Intent is weaker than behaviour.
- n = 3, one outside the segment, and two of the five stories are about fraud-type or physical-goods disputes.

## Quotes available (ask each person before using)

- "Auto-compile the evidence packet. Pull my logs, emails, usage into one PDF when the dispute hits. I'll review. But 80% done." (Merchant A)
- "Bank wants the same things every time. Checklist and template PDF. Cut time in half. Right now reinventing the wheel." (Merchant C)
- "$5 and $500 hit the same way." (Merchant A)
- "By the time I opened email, window gone... I had 3DS and login logs. I could have won." (Merchant A)
- "We had access logs but no real deliverables... better to accept and move on." (Merchant C)
- "The reason has to name the missing document. Not the probability. The gap." (Merchant A)
- "I've seen enough dashboards with made-up percentages." (Merchant C)
- "Nobody clicks tabs." (Merchant A)
- "If there was a number on my dashboard I'd check it weekly." (Merchant A, on his dispute ratio)

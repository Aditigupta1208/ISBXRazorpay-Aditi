# Merchant conversations: findings (9 Oct 2026)

Three conversations by the builder, using the question set in `docs/MERCHANT_CONVERSATIONS.md` (Parts 1 and 2; the prototype test was not run). Names and businesses are removed. The transcripts are held by the builder, not in this repo. n = 3, so these are signals that shaped choices, not evidence of how most merchants behave.

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

## What the conversations did not test, and one thing that surprised us

- All three won. Nobody told a story about a Fold, an Escalate, or a loss. The Fold-or-Fight and Escalate calls were not tested by these conversations. A follow-up on "a dispute you accepted or lost" is the missing piece.
- A fought partly to protect his dispute ratio: "If I lose, chargeback ratio goes up. Card networks start watching." B fought to avoid "setting a precedent". The advisor's money line prices only the amount and the fee. It does not mention either reason. Earlier research (in the build log) found that winning a dispute does not lower the card network's ratio, so A's belief may be wrong, and the advisor should explain that. Whether to add a line for this is open.
- The prototype test (Part 3) has not been run with any of them.

## Quotes available (ask each person before using)

- "Auto-compile the evidence packet. Pull my logs, emails, usage into one PDF when the dispute hits. I'll review. But 80% done." (Merchant A)
- "Bank wants the same things every time. Checklist and template PDF. Cut time in half. Right now reinventing the wheel." (Merchant C)
- "$5 and $500 hit the same way." (Merchant A)

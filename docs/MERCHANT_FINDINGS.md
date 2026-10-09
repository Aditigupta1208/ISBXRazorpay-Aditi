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

## Two facts checked on 9 Oct 2026

| Question | What the sources say | Confidence |
|---|---|---|
| Does losing raise the ratio, or winning lower it? | Visa's merchant program (VAMP) is described by two secondary sources (Checkout.com, Chargebacks Gurus) as (fraud reports + disputes) divided by settled card-absent transactions, counted monthly. Disputes count when raised. The only ways out are being resolved before they become a chargeback (Rapid Dispute Resolution, Compelling Evidence 3.0, alerts such as CDRN or Ethoca). Neither source says a won dispute is removed. The merchant threshold is 1.5% from 1 April 2026 (2.2% before), and a merchant is only identified with at least 1,500 fraud or dispute cases a month. | Medium: secondary sources, not Visa's own document; they do not state "winning does not remove it" in words. |
| What the merchants' fear may really be | At one to a few disputes a month, A, B and C are far below the 1,500-case minimum for Visa's merchant enforcement. C did get a warning email from Razorpay, so Razorpay may apply its own limit. Razorpay's public fees page states no ratio or threshold. | Unverified for Razorpay's own policy. |
| Can a contest be changed after it is sent? | Razorpay's contest API: `action=draft` saves evidence without sending and can be updated repeatedly; `action=submit` moves the dispute from `open` to `under_review`; actions on a dispute under review are rejected ("cannot perform any action on a dispute under review"). The page does not say in words that evidence cannot be added after submit. | Medium-high: it matches what the merchants said. |

**Merchant C's first recollection of the Razorpay warning (9 Oct, from memory; corrected below by the actual email).** He remembers an email from early 2023, after three international disputes in two months (two from one client). He recalls it saying his chargeback ratio had "exceeded 0.9% and is approaching the card network threshold of 1%", that crossing 1% would place him in the card networks' monitoring programmes, and that staying above for about three consecutive months could bring fines or a stop on international cards. He thinks all disputes raised count, not only losses, but says he never asked and is speculating. He earlier said "about 18 months ago", so the date is uncertain. These figures are consistent with the card networks' earlier programmes (Visa's was replaced by VAMP on 1 April 2025 according to the secondary sources), which would mean Razorpay was passing on a network threshold and not applying its own. That reading is unconfirmed. He will send a redacted copy if emailed, with his operations manager's approval and a day's notice, and wants to know who is asking and that his name will not appear.

His other point: "The warning email didn't change my behaviour. The loss did. Warnings don't work. Losses work." That supports showing the money consequence at the moment of decision, which the advisor already does, more than sending warnings.

**Reply received from Razorpay support (9 Oct, pasted by the builder).** The email is signed "The Razorpay Team" with no named person or ticket number, and says its answers rest on "public documentation and standard industry practices". Treat it as indicative until the original (with headers and a ticket number) is saved.

| Question | The reply | How far to rely on it |
|---|---|---|
| Does a submitted contest accept more evidence? | No. After `action=submit` the case is `under_review`; evidence can only be changed before, using `action=draft`. | High: it agrees with Razorpay's contest API page. Safe to build on: "save as a draft, get the document, then submit". |
| Own ratio limit? | Yes, Razorpay monitors dispute rates separately from the card networks, publishes no single limit, and "often recommends" staying under 0.5%. It says networks flag merchants at about 1%. Ratio is disputes divided by successful transactions. | Medium-low: the 0.5% figure is not in any public page I found. Do not state it in the product. |
| Counts when raised or when lost? | "Generally" when raised. On whether a win changes the ratio, it says to contact support with account details. | Medium: matches the secondary sources, but the reply does not answer the win question. |
| Above the limit? | A warning first, then possibly settlement holds, a rolling reserve, a more frequent review, or suspension. | Medium-low: generic. |

So the facts we can use are: a submitted contest is final, and a dispute counts when it is raised. Still not established: whether a win changes the ratio, and Razorpay's own limit. The ratio tile and any ratio advice stay on hold. To make this citable, save the original email with its headers and ticket number, and reply asking the two open points ("does a won dispute remain in the ratio?" and "where is the 0.5% guidance published?").

**From the actual warning email (merchant C, 9 Oct, key lines relayed by him).** Dated 14 March 2023. It quoted his ratio as 0.87% (his memory said 0.9%, and he said "18 months" when it was nearer two years). It said the card network threshold is 1%, and that staying above it for three consecutive months would place him in the networks' monitoring programme, with possible fines and, in serious cases, suspension of international card acceptance. It said nothing about won disputes, and he told us his earlier answer on that was a guess. These are his relayed lines, not a scan of the email.

**From a senior colleague at Razorpay (informal, unnamed, not an official position; the reply says so itself).**
- Whether a won dispute is removed from the ratio is not stated in Razorpay's public documentation. The reply gives the card networks' general practice (counted when raised) and says it cannot confirm this as Razorpay's published position.
- The 0.5% figure is not a published limit. It appears in Razorpay blog content as a recommendation.
- A submitted contest cannot be added to; use `action=draft` before submitting (matches the API page).

**Checked against Razorpay's own blog on 9 Oct (public, citable).**
- "Use clear descriptors, transparent refund policies, and proactive support to keep your chargeback ratio under 0.5%." and "Set an internal chargeback alert at 0.5%, half the 1% network threshold" (Razorpay blog, "what to do when your payment gateway account is frozen").
- "As it approaches 0.5%, begin investigation. At 0.75%, implement emergency controls." "The merchant VAMP threshold changed to 1.5% effective April 1, 2026." Ratio: "divide disputes in a month by transactions processed in the same period" (Razorpay blog, "international payment chargebacks for Indian businesses"). It does not say whether won disputes are counted.
- Two things disagree: the 2023 email and one blog say 1%, another blog says 1.5% from April 2026. The older figure fits the networks' earlier programmes. Use the Razorpay blog's current 1.5% for Visa and say the figure changes.

**What we can now say in the product, and what we cannot.**
- Can say, with the blog attributed: Razorpay's blog recommends keeping the ratio under 0.5% (a recommendation, not a limit); the ratio is disputes in a month divided by transactions in that month; Visa's merchant threshold is 1.5% from April 2026.
- Can say, hedged: a dispute counts when it is raised. Razorpay does not publish whether a win removes it.
- Cannot say: that fighting does or does not protect the ratio, or any Razorpay-specific limit.
- The ratio tile is therefore possible, using those three published bands. It stays on the backlog.

What this means: "submit now, mark this pending" is not safe advice, because a submitted contest cannot be added to. The advisor should say "save as a draft, get the document, then submit" while the deadline allows it, and "submit what you have" only as a clear last resort. And the advisor should not tell a merchant that fighting protects their ratio, or that it does not, until Razorpay or Visa confirms it for them. The next step is the redacted warning email from merchant C (he has agreed to send one if emailed) and Razorpay's own answer on their thresholds.

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
- "The warning email didn't change my behaviour. The loss did." (Merchant C)
- "If there was a number on my dashboard I'd check it weekly." (Merchant A, on his dispute ratio)

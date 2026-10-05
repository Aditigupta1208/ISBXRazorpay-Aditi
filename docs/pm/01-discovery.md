# PM discovery: problem to metrics

Stage 1 of the product work for the Dispute Decision Agent. Next stages: feature definition (USP, supporting, moonshot, deprioritised), PRD for the MVP, interface and flows, then the build.

**Evidence labels used below**
- **[V]** verified from a public source (listed at the end)
- **[A]** assumption or inference, to be validated
- **[T]** from our own kill test (`eval/kill-test-v1.md`)

No merchant interviews were possible. Personas are composites built from public cases and Razorpay's own content, and should be validated with 2–3 merchant conversations.

---

## 1. The problem

### Problem statement

> Indian businesses that sell services and subscriptions to international card customers lose money on **non-fraud card disputes** they could have won, or should have settled differently. Responding well needs expertise they don't have, evidence that sits outside Razorpay, and a fight-or-accept decision made within **3 business days**. Razorpay protects them against fraud disputes, but not against these.

### Why it happens (root causes)

| Root cause | Evidence |
|---|---|
| **Disputes are rare, urgent and rule-heavy.** A small merchant sees a few a year, so never builds expertise, and each reason code has different winning proof. | Visa sets different remedies per reason code [V: [Visa Dispute Management Guidelines](https://usa.visa.com/content/dam/VCOM/global/support-legal/documents/merchants-dispute-management-guidelines.pdf)]; a few disputes a year per small merchant [A] |
| **The deadline is short.** | 3 business days to represent [V: [Razorpay chargeback guide](https://razorpay.com/blog/chargebacks/)]; no response is treated as accepted [V: [Razorpay Curlec help](https://curlec-help.freshdesk.com/support/solutions/articles/151000183117-what-are-disputes-chargebacks-and-how-to-respond-to-them-)] |
| **The winning evidence is outside Razorpay.** For service and subscription disputes it is a signed scope, login logs, terms acceptance, emails, vouchers. | [V: [Razorpay international chargebacks guide, Aug 2026](https://razorpay.com/blog/international-payment-chargebacks-for-indian-businesses-how-to-win-prevent-and-handle-them)]; Razorpay's own data covers payments, refunds, 3-D Secure [V: [Razorpay disputes API](https://razorpay.com/docs/api/disputes/contest/)] |
| **The economics are invisible.** A lost international dispute is clawed back at the current exchange rate; escalation can cost hundreds of dollars. | [V: [Razorpay international chargebacks guide, Aug 2026](https://razorpay.com/blog/international-payment-chargebacks-for-indian-businesses-how-to-win-prevent-and-handle-them)]; Visa arbitration fee USD 600 [V: same]; Mastercard arbitration USD 675 [V: [Razorpay chargeback guide](https://razorpay.com/blog/chargebacks/)] |
| **Existing protection stops at fraud.** | Chargeback Shield covers fraud reason codes only and excludes "quality, delivery, or description" disputes [V: [Chargeback Shield terms](https://razorpay.com/terms/chargeback-shield/)]. Dispute Responder gathers evidence from Razorpay and connected platforms such as Shopify and Shiprocket [V: [Agent Studio guardrails blog](https://razorpay.com/blog/razorpay-agent-studio-principles-guardrails-and-merchant-control/)]; nothing public says it reads merchant-uploaded documents or recommends accept vs fight [A]. |

### What it costs

- **Merchants:** nearly half of small-business merchants don't respond to chargebacks at all [V: [Antom Copilot launch, Jul 2025](https://fintechnews.sg/114081/ai/ant-international-antom-copilot-ai-upgrade/)], so they lose winnable disputes outright. Others fight disputes they can't win and pay fees. Disputed money is deducted and held during the dispute [V: [Razorpay chargeback guide](https://razorpay.com/blog/chargebacks/)]. Liability "solely rests with" the merchant, and network fines are passed on [V: [Razorpay terms](https://razorpay.com/terms/)].
- **Razorpay:** Razorpay can suspend merchants for "excessive disputes" [V: [Razorpay terms](https://razorpay.com/terms/)]. Visa's monitoring programme counts every card-not-present dispute; the Asia Pacific merchant threshold is 1.5% from Apr 2026, with USD 8 per dispute for flagged merchants and acquirer thresholds from 0.5% [V: [Ravelin on Visa VAMP](https://www.ravelin.com/blog/visa-vamp-changes-chargeback-disputes)]. Cross-border payments see roughly twice the domestic dispute rate [V: [Razorpay international chargebacks guide, Aug 2026](https://razorpay.com/blog/international-payment-chargebacks-for-indian-businesses-how-to-win-prevent-and-handle-them)]. International cards are Razorpay's higher-fee segment (up to 3%) [V: [Razorpay international payments page](https://razorpay.com/accept-international-payments/)].

### Job to be done

> "When a customer disputes an international payment, help me decide quickly whether it's worth fighting, and if it is, give me a response the bank will accept, so I don't lose money or time I didn't need to."

### What we are not solving

- **Fraud disputes:** covered by Chargeback Shield ([terms](https://razorpay.com/terms/chargeback-shield/)).
- **Stopping disputes before they're filed:** needs card-network alert data Razorpay doesn't publicly offer; UPI has no equivalent stage.
- **Domestic UPI disputes:** a different process (NPCI UDIR; see [Razorpay's UDIR explainer](https://razorpay.com/blog/all-you-need-to-know-about-npci-led-udir/)).
- **Physical-goods ecommerce:** Dispute Responder plus Shopify and Shiprocket fits better there.

---

## 2. Customers, segmentation and personas

### Who is involved

| Role | Who | What they want |
|---|---|---|
| **User** | The merchant, or whoever handles disputes for them | Keep their money, spend little time |
| **Buyer and owner** | Razorpay (Agent Studio, risk and disputes teams) | Protect the international segment, lower dispute ratios, fewer support tickets |
| **Internal user** | Razorpay disputes and risk operations | Cleaner submissions, fewer escalations |
| **Decider** | The card issuer | Clear evidence that matches the reason code |
| **Counterparty** | The cardholder | A fair outcome |

### Segmentation: one axis

**Axis: where the evidence that wins the dispute lives.**

We chose this axis because it decides whether anyone already solves the problem, and whether AI is needed.

| Segment | Where the winning evidence lives | Typical merchants | Who helps today |
|---|---|---|---|
| **A. Payment-proof disputes** | Inside Razorpay (payment, refund record, 3-D Secure) | Any merchant whose dispute is "refund not received" and the refund is on record | Razorpay's own data is enough |
| **B. Delivery-proof disputes** | In a connected store or shipping app (order, tracking, delivery confirmation) | D2C and ecommerce brands on Shopify, Shiprocket | Razorpay Dispute Responder ([Agent Studio guardrails blog](https://razorpay.com/blog/razorpay-agent-studio-principles-guardrails-and-merchant-control/)) |
| **C. Service-proof disputes** | In the merchant's own systems: contracts, login and usage logs, terms acceptance, emails, WhatsApp, vouchers | SaaS, agencies and consultants, inbound travel, online courses and digital products | **No one.** Chargeback Shield excludes these ([terms](https://razorpay.com/terms/chargeback-shield/)); global tools like Chargeflow don't support Razorpay ([integrations](https://www.chargeflow.io/integrations)) |

**Target: Segment C**, for international card payments. The evidence is unstructured and lives outside Razorpay, so this is where an agent that reads documents adds the most.

Within Segment C, we start with businesses **without a dedicated dispute team** (founder or a finance/ops generalist handles disputes), because they lack the expertise and time. This is a prioritisation within the segment, not a second axis.

**Size:** Razorpay serves 50,000+ cross-border businesses ([Razorpay Shield blog](https://razorpay.com/blog/razorpay-upticks-success-rates-razorpay-shield/)); the share in Segment C is unknown [A].

### Personas (composites, to be validated)

All three merchant personas sit in Segment C, one per business type (SaaS, services, travel). **Ananya is the primary persona** for the pitch and demo: SaaS evidence (login logs, terms acceptance) is the clearest to show, and SaaS is a cross-border segment Razorpay names. Meera represents Razorpay's own side of the problem.

**P1. Ananya, the founder-operator (primary persona)**
- Co-founder of a 12-person B2B SaaS company in Pune; most customers in the US and UK; annual plans billed by card.
- Handles finance herself. Gets a few disputes a year, mostly "I cancelled" or "not as described".
- Today: sees an email, Googles the reason code, isn't sure what to send, and often lets small ones go.
- Goal: not lose money she earned, without spending half a day on it.
- Basis: Razorpay's SaaS evidence guidance [V]; Visa 13.2 and 13.3 rules [V].

**P2. Rohit, the ops and finance generalist**
- Finance and operations manager at a 25-person inbound tour operator in Jaipur; guests from the UK and Europe.
- Several disputes a month in peak season: "service not provided", "I cancelled".
- Evidence is everywhere: vouchers, hotel check-in registers, WhatsApp chats, signed tour sheets.
- Today: chases hotels and guides for proof under deadline; sometimes accepts disputes he could win.
- Goal: get through the queue on time and stop repeat disputes.
- Basis: Razorpay travel chargeback guide [V]; Visa 13.1 and 13.7 [V].

**P3. Priya, the solo exporter**
- Freelance UX designer in Mumbai billing international clients by Payment Link; USD 1,000–5,000 projects.
- Disputes are rare but large, usually "not as described" weeks after delivery.
- Has the evidence (signed scope, approvals, file access logs) but doesn't know it wins.
- Goal: not lose a month's income to one dispute.
- Basis: Karbon's public "Priya" case, won with SOW, approvals and Figma logs [V]; Winvesta's Rs 4.17 lakh loss case [V].

**P4. Meera, Razorpay disputes and risk operations (internal)**
- Handles merchant tickets about disputes and monitors portfolio dispute ratios.
- Goal: fewer "what do I do?" tickets, better-quality submissions, fewer merchants near network thresholds.
- Basis: Razorpay's suspension clause and VAMP acquirer thresholds [V]; her day-to-day work is [A].

---

## 3. Pain points by persona

Mapped to the dispute journey: **notice → understand → gather → decide → respond → after**.

| # | Pain point | Stage | P1 Ananya | P2 Rohit | P3 Priya | P4 Razorpay |
|---|---|---|---|---|---|---|
| PP1 | "I don't understand what the customer is claiming, or what proof wins this kind of dispute." | Understand | ●●● | ●● | ●●● | Tickets |
| PP2 | "I can't tell whether fighting is worth it": unknown odds, exchange-rate clawback, fees. Leads to fighting losers or abandoning winners. | Decide | ●●● | ●●● | ●●● | Arbitration exposure |
| PP3 | "The proof is scattered (logs, emails, WhatsApp, hotel records), and I don't know which pieces matter." | Gather | ●● | ●●● | ●● | Weak submissions |
| PP4 | "Writing a response the bank accepts, in the right format and under 1,000 characters, is hard." | Respond | ●● | ●● | ●●● | Weak submissions |
| PP5 | "The dispute arrives as one email among many, and three business days go fast." | Notice | ●● | ●●● | ●● | Non-responses |
| PP6 | "The money is deducted the moment the dispute starts." | All | ●● | ●● | ●●● | Merchant frustration |
| PP7 | "I never learn why I lost, so the same dispute happens again." | After | ● | ●●● | ● | Dispute ratios rise |
| PP8 | Razorpay: support load, merchants drifting toward network thresholds, fee exposure. | All | | | | ●●● |

●●● severe · ●● moderate · ● minor [A, from personas]

### Is any of this already solved by Razorpay?

Checked against what Razorpay has published. None of these pains is entirely new; what is new is the Segment C version of PP1, PP2, PP3 and PP7.

| # | Pain point | What Razorpay offers today | Solved today? |
|---|---|---|---|
| PP1 | Don't know what wins | Generic guides on reason codes and evidence ([reason codes](https://razorpay.com/blog/chargeback-reason-codes/), [international chargebacks guide](https://razorpay.com/blog/international-payment-chargebacks-for-indian-businesses-how-to-win-prevent-and-handle-them)); nothing specific to the merchant's case | Partly |
| PP2 | Don't know if it's worth fighting | Dispute Responder "scores win probability" ([Agent Studio guardrails blog](https://razorpay.com/blog/razorpay-agent-studio-principles-guardrails-and-merchant-control/)); nothing public on exchange-rate clawback or fee economics | Partly |
| PP3 | Evidence scattered | Dispute Responder gathers evidence from Razorpay, Shopify and Shiprocket (same blog); manual uploads on the [disputes dashboard](https://razorpay.com/docs/payments/disputes/dashboard/?preferred-country=IN). Nothing reads evidence from the merchant's own systems | Solved for Segment B, not Segment C |
| PP4 | Writing the response | Dispute Responder submits a response or a "ready-to-approve draft" (same blog) | Partly; likely weaker for Segment C without its evidence [A] |
| PP5 | Missing the deadline | Email and webhook alerts on every dispute ([About disputes](https://razorpay.com/docs/payments/disputes/)); Dispute Responder acts "the moment they land" | Largely solved |
| PP6 | Money taken at dispute start | Card-network rule | Not solvable |
| PP7 | No learning, repeats | Shield risk dashboard tracks dispute ratio ([Shield blog](https://razorpay.com/blog/razorpay-upticks-success-rates-razorpay-shield/)); generic prevention advice; nothing on why a specific dispute was lost | Partly |
| PP8 | Razorpay: tickets, thresholds, fees | Chargeback Shield takes liability for fraud disputes ([terms](https://razorpay.com/terms/chargeback-shield/)) and tracks dispute ratios | Partly (fraud only) |

**Framing that follows:** this product is an extension of Dispute Responder into Segment C, plus a case-specific fight-or-accept decision and post-loss prevention, not a replacement.

---

## 4. Prioritising the pain points

Scored 1–5 on each criterion; higher means a stronger case to solve now.

| # | Pain point | Frequency | Severity (₹) | Unsolved today | Razorpay can act | AI advantage | **Total /25** |
|---|---|---|---|---|---|---|---|
| PP1 | Don't know what wins | 5 | 4 | 4 | 5 | 5 | **23** |
| PP2 | Don't know if it's worth fighting | 5 | 5 | 4 | 4 | 4 | **22** |
| PP3 | Evidence scattered | 4 | 5 | 4 | 3 | 5 | **21** |
| PP4 | Writing the response | 4 | 3 | 3 | 5 | 5 | **20** |
| PP5 | Missing the deadline | 3 | 5 | 2 | 5 | 1 | **16** |
| PP7 | No learning, repeats | 2 | 3 | 4 | 4 | 3 | **16** |
| PP6 | Money deducted upfront | 5 | 3 | 2 | 2 | 1 | **13** |

Why some scores are low:
- **PP2 "unsolved" is 4** because Dispute Responder already scores win probability [V], though not with exchange-rate and fee economics.
- **PP4 "unsolved" is 3** because Dispute Responder already drafts responses [V].
- **PP5 "unsolved" is 2** because Razorpay already sends email and webhook alerts [V: Razorpay disputes docs].
- **PP6 is network policy;** Razorpay can't change when money is held.

**Decision**
- **Solve now:** PP1 + PP2 (the decision) and PP3 (the evidence). This is the core.
- **Include because it's cheap once the core exists:** PP4 (the draft).
- **Supporting:** PP5 (deadline triage), PP7 (learning and prevention).
- **Out:** PP6. Mention it as context only.

---

## 5. Possible solutions

| # | Solution | Pains addressed |
|---|---|---|
| S1 | **Decision copilot:** explains the claim in plain words, names the winning proof for that reason code, and recommends Fight / Accept / Escalate with economics (amount, exchange-rate clawback, fees, odds) | PP1, PP2 |
| S2 | **Evidence from anywhere:** merchant uploads, pastes or forwards documents; AI extracts facts, checks them against the claim and payment, flags contradictions and gaps, maps each to Razorpay's evidence slots | PP3 |
| S3 | **Cited response drafter:** reason-specific response, every sentence citing a document, within 1,000 characters | PP4 |
| S4 | **Deadline triage inbox:** ranked by money at stake and time left, with WhatsApp nudges | PP5 |
| S5 | **Connectors:** pull evidence automatically from product logs, Gmail, booking or CRM systems | PP3 |
| S6 | **Prevention advisor:** after a loss, names the root cause and one fix (click-to-accept terms, renewal reminder, clearer statement descriptor) | PP7, PP8 |
| S7 | **Pre-dispute outreach:** contact the customer before they dispute | PP5 |
| S8 | **Fully autonomous submission:** agent files without merchant approval | PP4, PP5 |
| S9 | **Service-dispute cover:** extend Chargeback Shield so Razorpay takes liability for non-fraud disputes it judges winnable | PP2, PP6 |
| S10 | **Network learning:** win odds by reason code × evidence type, learned across Razorpay merchants | PP2, PP7 |
| S11 | **Human expert service:** Razorpay dispute experts on call | PP1, PP4 |
| S12 | **Static playbooks:** a checklist per reason code (no AI) | PP1 |

---

## 6. Evaluating trade-offs and prioritising solutions

### Scoring (1–5, higher is better; risk scored so 5 = lowest risk)

| # | Solution | Impact on top pains | Needs AI | Feasible for Razorpay | Differentiated | Low risk | **Total /25** | Call |
|---|---|---|---|---|---|---|---|---|
| S1 | Decision copilot | 5 | 5 | 5 | 5 | 4 | **24** | **Prioritise** |
| S2 | Evidence from anywhere | 5 | 5 | 4 | 5 | 4 | **23** | **Prioritise** |
| S3 | Cited drafter | 4 | 5 | 5 | 2 | 4 | **20** | **Prioritise** (part of core loop) |
| S6 | Prevention advisor | 3 | 4 | 4 | 4 | 5 | **20** | Supporting |
| S10 | Network learning | 4 | 4 | 3 | 5 | 4 | **20** | Supporting, light version |
| S9 | Service-dispute cover | 5 | 3 | 2 | 5 | 2 | **17** | Moonshot |
| S4 | Deadline triage | 3 | 1 | 5 | 2 | 5 | **16** | Supporting (needed for usability) |
| S5 | Connectors | 4 | 3 | 2 | 4 | 3 | **16** | Later |
| S12 | Static playbooks | 2 | 1 | 5 | 1 | 5 | **14** | Deprioritise; it's our baseline |
| S8 | Fully autonomous | 3 | 3 | 4 | 2 | 1 | **13** | Deprioritise |
| S11 | Human experts | 3 | 1 | 3 | 2 | 4 | **13** | Deprioritise |
| S7 | Pre-dispute outreach | 3 | 3 | 1 | 3 | 2 | **12** | Deprioritise |

### Why the deprioritised ones lose

- **S12 static playbooks:** this is exactly the checklist our kill test beat, 8/15 vs 15/15 [T]. It can't read evidence or say "escalate".
- **S8 fully autonomous:** money and legal claims need a human sign-off. Agent Studio's own terms require approval gates for financial actions [V: Agent Studio terms], and a wrong submission can't be undone.
- **S11 human experts:** doesn't scale to small merchants and doesn't use AI.
- **S7 pre-dispute outreach:** Razorpay has no reliable signal before a dispute is filed.

### Key trade-offs made

| Trade-off | Chose | Gave up | Why |
|---|---|---|---|
| **Autonomy vs trust** | Merchant approves every action | Speed of auto-filing | Irreversible money decisions; approval gates are Agent Studio policy [V] |
| **Bias to fight vs honest advice** | Recommend Accept or Escalate when fighting isn't worth it | A higher "fight rate" headline | Fighting losers costs fees and trust; C15 shows a rule-only reviewer would have refunded USD 1,600 too much [T] |
| **Connectors vs speed** | Uploaded and pasted evidence in v1 | Automatic evidence pull | Works for every merchant on day one; connectors are v2 |
| **Breadth vs depth** | Non-fraud disputes, international cards, services and subscriptions only | Fraud, UPI, physical goods | Each is covered elsewhere or needs a different process |
| **Recommend vs guarantee** | Recommendation with confidence and citations | Taking on liability (S9) | Liability needs underwriting data Razorpay would only have after the product runs |

---

## 7. Metrics

### North Star

**Net ₹ recovered per ₹ disputed** on non-fraud international disputes handled through the agent. "Net" means after exchange-rate effects and dispute fees.

It captures both halves of good advice: winning what's winnable, and not throwing fees at what isn't.

### Input metrics (what drives the North Star)

| Metric | Definition | Why |
|---|---|---|
| **On-time response rate** | Share of disputes with a decision (fight or accept) before the deadline | Non-response is an automatic loss; baseline for small merchants is around half not responding [V: Antom] |
| **Win rate on contested disputes** | Won ÷ fought | Quality of fight decisions and drafts |
| **Avoided-loss rate** | Share of accepted or escalated disputes that would have lost if fought (judged later, or by reviewer sample) | Rewards honest "accept" advice |
| **Time to respond** | Dispute opened → merchant submits | Effort saved |
| **Evidence completeness** | Share of fought disputes where the deciding evidence for that reason code is attached | Leading indicator of win rate |
| **Draft acceptance** | Share of drafts approved with only minor edits | Usefulness of the AI output |

### Guardrail metrics (must not get worse)

| Metric | Target |
|---|---|
| **Unsupported claims in submitted responses** | 0 |
| **Arbitration losses** | Not above the pre-launch baseline |
| **Merchant override rate** | Watched both ways: very high means poor advice, near zero may mean rubber-stamping |
| **Wrongful accepts** | Accepted disputes later judged winnable, kept low |

### Business metrics for Razorpay

- Dispute-related support tickets per 1,000 international merchants
- Share of international merchants above Visa's early-warning dispute ratio
- Retention and international volume of merchants who had a dispute
- Agent adoption: share of eligible disputes opened in the agent
- Revenue, if priced on outcome: fee per dispute won [A: outcome pricing is being explored by Indian fintechs, Business Standard Sep 2026]

### AI quality metrics (offline, before every prompt change)

| Metric | Current (kill test v1) [T] |
|---|---|
| Decision agreement with expert labels | 15/15 (checklist 8/15) |
| Correct deciding evidence | 15/15 |
| Unsupported claims in drafts | 0 of 8 |
| Fraud cases routed correctly | 1/1 |
| Cost and response time per dispute | To be measured in the live build |

### Targets for a pilot

These are hypotheses to test with a pilot group, not promises:
- On-time response rate from about 50% to 90%+
- Time to respond under 15 minutes of merchant effort
- Zero unsupported claims submitted
- Win rate on contested disputes at or above the pre-pilot rate, while the fight rate drops

**How to measure:** pilot with eligible merchants, compare against matched merchants without the agent over two dispute cycles (outcomes take 30–45 days to arrive).

---

## Sources

- Visa Dispute Management Guidelines for Merchants: https://usa.visa.com/content/dam/VCOM/global/support-legal/documents/merchants-dispute-management-guidelines.pdf
- Razorpay chargeback guide: https://razorpay.com/blog/chargebacks/
- Razorpay international chargebacks guide (Aug 2026): https://razorpay.com/blog/international-payment-chargebacks-for-indian-businesses-how-to-win-prevent-and-handle-them
- Razorpay travel chargeback guide: https://razorpay.com/blog/travel-chargeback-prevention-guide/
- Razorpay Curlec disputes help: https://curlec-help.freshdesk.com/support/solutions/articles/151000183117-what-are-disputes-chargebacks-and-how-to-respond-to-them-
- Razorpay disputes API (contest): https://razorpay.com/docs/api/disputes/contest/
- Razorpay terms: https://razorpay.com/terms/
- Chargeback Shield terms: https://razorpay.com/terms/chargeback-shield/
- Razorpay Shield blog: https://razorpay.com/blog/razorpay-upticks-success-rates-razorpay-shield/
- Razorpay international payments: https://razorpay.com/accept-international-payments/
- Agent Studio guardrails: https://razorpay.com/blog/razorpay-agent-studio-principles-guardrails-and-merchant-control/
- Agent Studio terms: https://razorpay.com/tnc/agent-studio/
- Antom Copilot (SME non-response): https://fintechnews.sg/114081/ai/ant-international-antom-copilot-ai-upgrade/
- Ravelin on Visa VAMP: https://www.ravelin.com/blog/visa-vamp-changes-chargeback-disputes
- Karbon, Indian freelancer chargebacks: https://www.karboncard.com/blog/chargebacks-for-indian-freelancers
- Winvesta, chargebacks and Indian exporters: https://www.winvesta.in/blog/businesses/chargeback-fraud-is-bleeding-indian-exporters-dry
- Chargeflow integrations: https://www.chargeflow.io/integrations
- Business Standard, fintechs and agentic AI (Sep 2026): https://www.business-standard.com/companies/start-ups/india-fintech-startups-agentic-ai-payments-paytm-pine-labs-razorpay-126090201458_1.html

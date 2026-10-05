# Screens: Dispute Advisor

Stage 4, part 1. What Razorpay's dispute experience looks like today (public docs only), and the screen-by-screen flow for Dispute Advisor. Data flow, tech stack and design system follow in part 2.

---

## 1. Razorpay today (from public sources)

### 1.1 Disputes in the dashboard

Source: [Disputes – Dashboard Actions](https://razorpay.com/docs/payments/disputes/dashboard/?preferred-country=IN), [About Disputes](https://razorpay.com/docs/payments/disputes/), [Contest API](https://razorpay.com/docs/api/disputes/contest/).

| Step | What the merchant sees today |
|---|---|
| Find disputes | Left menu **Transactions → Disputes**. A list of all disputes, filters, a download icon, and a **Details** button per row |
| Open one | **Details** opens a right-side pane with the dispute's information |
| Fold | **Accept Dispute** → confirm **Yes, Accept**. "The corresponding amount will be deducted from your Razorpay account balance"; status becomes `lost` |
| Fight | **Contest & upload evidence** → set amount (full, or partial via **Edit**) → explanation of why the dispute is invalid → **Add Document** dropdown to pick the evidence type → upload PDF, PNG or JPG → **Submit Evidence** → confirm **Yes Contest** |
| API equivalent | `PATCH /v1/disputes/{id}/contest` with `action: draft` or `submit`, `amount`, `summary` (max 1,000 characters), 11 document slots plus `others`; at least one document to submit. `POST /v1/disputes/{id}/accept` |
| Statuses | Open, Under Review, Won, Lost, Closed |
| Alerts | Email when a dispute is created; webhooks on creation and status changes |
| International | Deduction uses the exchange rate on the day the dispute was created |

**What's missing for a Segment C merchant:** the pane shows the facts and two buttons. It does not say what the claim means, what proof wins for this reason code, whether fighting is worth it, or what to write. The merchant faces a blank explanation box and an evidence-type dropdown.

### 1.2 Agent Studio

Source: [Agent Studio guardrails](https://razorpay.com/blog/razorpay-agent-studio-principles-guardrails-and-merchant-control/), [Agent Studio blog](https://razorpay.com/blog/agent-studio-ai-agents-by-razorpay/), [Sprint 26](https://razorpay.com/sprint/26), [terms](https://razorpay.com/tnc/agent-studio/).

| Element | Public description |
|---|---|
| Setup | Merchant "reviews and approves exactly what data the agent can access, what actions it can take, and where it needs human approval" |
| Review-first mode | Agent prepares the work and "holds it for the merchant to review before anything is submitted or sent" |
| Approvals | Merchant can require manual approval for any class of action or above a threshold; escalation "on WhatsApp" |
| Visibility | "Exactly what the agent did, when, and why" on the agent's **performance dashboard** |
| Off switch | "Turn off any agent at any time. One tap." |
| Dispute agent | Called Dispute Responder, Dispute Expert and Dispute Auto-Responder in different posts; gathers evidence "from Razorpay, Shopify, Shiprocket, and other connected platforms" and submits or sends "a ready-to-approve draft" |

No public screenshots of Agent Studio screens exist, so our Agent Studio screens are our own design, built on these described behaviours.

### 1.3 Design principle that follows

**Extend the Disputes page the merchant already uses; don't send them to a new app.** The call appears in the existing list and the existing detail view. Agent Studio is where the merchant sets the agent up once. Familiar labels stay: "Accept dispute" sits under Fold, "Contest" under Fight.

---

## 2. Screen map

```
Notification (email / WhatsApp) ─┐
                                 ▼
[1] Disputes list ──▶ [2] Dispute detail ──┬─▶ [3] Evidence (inside 2) ──▶ re-run
     (+ call column)       (Fight-or-Fold)  ├─▶ [4] Review and submit (Fight)
                                            ├─▶ [5] Fold confirmation
                                            ├─▶ [6] Escalate state (inside 2)
                                            ├─▶ [7] Outcome, next steps and prevention tip
                                            └─▶ [8] Under the hood (drawer)
[9] Agent setup (Agent Studio)    [10] Evals    [11] How it works (prototype only)
```

Every screen carries the banner: "Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product."

---

## 3. Screens

### [1] Disputes list (extends Transactions → Disputes)

**Job:** show what needs a decision, most money and least time first.

```
┌ Transactions › Disputes ──────────────────────────────────────────────────────┐
│ 4 need a decision   ₹6.2L at stake   2 due within 24h                         │
├───────────────────────────────────────────────────────────────────────────────┤
│ Dispute      Amount              Reason                    Time left  Call     │
│ disp_..C15   $3,200 · ₹2.67L     13.3 Not as described     18h ⚠      Escalate │
│ disp_..C04   $1,188 · ₹99K       13.2 Cancelled subscr.    2d         Fight    │
│ disp_..C14   $860  · ₹72K        13.7 Cancelled service    2d         Fold     │
│ disp_..C16   $420  · ₹35K        10.4 Fraud                3d         Shield   │
└───────────────────────────────────────────────────────────────────────────────┘
```

- New: summary strip, INR beside original currency, reason in plain words, time left with ⚠ under 24h, **Call** chip (text + colour, never colour alone), default sort by ₹ at stake × urgency.
- Fraud rows show "Chargeback Shield" and no call.
- Kept: filters, download, status, row click opens detail.
- Requirements: FR-1 to FR-5, FR-12.

### [2] Dispute detail: the Fight-or-Fold check

**Job:** let the merchant understand the dispute and decide in under two minutes.

Full page instead of the right-side pane, because the check needs room. Two columns.

```
┌ disp_demoC04 · $1,188 · Visa 13.2 Cancelled recurring · 2 days left ────────────┐
│ LEFT: the case                         │ RIGHT: the check                        │
│ What the customer says                 │ ┌ FIGHT · High confidence ────────────┐ │
│  "I cancelled before renewal."         │ │ Renewal terms were accepted and the │ │
│ What this means                        │ │ customer used the product after the │ │
│  Visa sides with the customer if they  │ │ renewal date.                       │ │
│  cancelled before renewal or weren't   │ └─────────────────────────────────────┘ │
│  told it would renew.                  │ Rule: Visa 13.2 – merchant wins with... │
│ What Razorpay knows                    │ Deciding evidence: [E2] [E3] [Razorpay] │
│  Paid 12 Mar · 3-D Secure · no refund  │ Missing: none   Contradictions: none    │
│ Your evidence  [+ Add]                 │ Money                                   │
│  E1 Policy (from profile)              │  At stake ₹99,000 · fees at risk ₹50K   │
│  E2 Checkout terms log    access_log   │  AI estimate of odds 75%                │
│  E3 Login log after renewal            │  Fighting is worth it ✓                 │
│                                        │ [Review response]  [Fold]  [Escalate]   │
│                                        │ Under the hood ›                        │
└────────────────────────────────────────┴─────────────────────────────────────────┘
```

- Clicking an evidence ID highlights the item on the left.
- If a safety rule changed the call: label "Changed by safety rule: Fight needs complete evidence".
- If the model's call and the money test disagree: amber note "Check the money".
- Primary button follows the call (Review response for Fight, Fold for Fold, Add evidence for Escalate); the other actions stay available as overrides.
- Requirements: FR-6 to FR-12, FR-24.

### [3] Evidence (inside the detail page)

**Job:** get the merchant's proof in and show what each piece proves.

- **Add evidence:** title + paste text (4,000-character counter), or upload PDF/PNG/JPG (if the day-1 test passes). Card numbers rejected with "Remove the card number and try again".
- Each item shows: ID, title, extracted key facts (2–3 lines), Razorpay evidence slot, flags (contradiction, "Couldn't read", instruction-like text).
- After any change, a bar: "Evidence changed. **Re-run check**". During the run, progress steps: "Reading 3 documents… Applying Visa 13.2… Writing the response…".
- **Demo moment (C06):** add "Customer clicked Cancel on 30 Jul" → re-run → call flips Fight → Fold, and the reason names the new item.
- Requirements: FR-13 to FR-18.

### [4] Review and submit (Fight)

**Job:** turn the call into a response the merchant trusts enough to send.

- Editable draft, 1,000-character counter. Each sentence shows its citation as a chip; a sentence without one is underlined red with "Add a source or remove this sentence".
- **Documents by slot** list (e.g. `access_activity_log`: E3), mirroring Razorpay's **Add Document** types.
- **Contest amount:** full by default; pre-filled partial amount when the check names a defensible part, editable.
- **Approve and submit** → confirmation: "This sends your response to the customer's bank. You can't edit it afterwards." → **Yes, submit**. The prototype then shows the exact `PATCH /v1/disputes/{id}/contest` request, labelled "Simulated: not sent".
- Blocked states: missing citation, over 1,000 characters, no document attached.
- Requirements: FR-19 to FR-23a.

### [5] Fold confirmation

**Job:** make letting go a clean, informed choice.

- "Fold this dispute? ₹72,000 will be deducted from your balance (USD 860 at ₹83.7, the rate on the day the dispute was created). This can't be undone."
- Shows why (the one-line reason) and, if the merchant is overriding a Fight call, an optional "Why?" box.
- **Yes, fold** → shows the `POST /v1/disputes/{id}/accept` request, labelled "Simulated: not sent".
- Requirement: FR-22, FR-23, FR-24.

### [6] Escalate state (inside the detail page)

**Job:** tell the merchant the one thing to get, and by when.

- Call card: "ESCALATE · Get this first: the signed group-tour policy showing the 50% cancellation fee."
- Deadline line: "You have 18 hours. If you can't get it, choose Fight for ₹1.33L (the defensible half) or Fold."
- Copy-able request text to send a colleague or supplier.
- Note: "Draft saved to Razorpay" (draft contest, FR-23b).
- Under 6 hours: "No time to gather more: choose Fight or Fold."
- Requirements: FR-10, FR-23b, edge case E5.

### [7] Outcome, next steps and prevention tip

**Job:** close the loop, point to the follow-up, and stop the next dispute.

- Status timeline: Open → Under review → Won / Lost (prototype: demo toggle).
- After a loss: "Next time" card with one fix, e.g. "Add a click-to-accept checkbox for renewal terms at checkout".
- After a loss or Fold: "Next steps" card with two prompts to confirm, not advice: "Ask your bank about reducing the export value for this payment (Razorpay can supply the dispute documents)" and "Ask your accountant whether a GST credit note applies".
- Thumbs up / down on the call, with optional reason (FR-30).
- Requirements: FR-29, FR-30.

### [8] Under the hood (drawer)

**Job:** show Razorpay reviewers and judges that the AI is real, checked and cheap.

- Result type: **Live** or **Saved result** (model, prompt version, date).
- Model, prompt version, tokens in/out, response time, cost (USD and ₹).
- Safety rules R1–R7 with pass / changed / blocked.
- Raw JSON output.
- Audit trail: every check, edit, override and action with time and actor.
- Requirements: FR-25, FR-26.

### [9] Agent setup (Agent Studio → Dispute Advisor)

**Job:** set the agent up once.

- **Policy profile:** refund, cancellation and renewal terms; how customers accept them (checkout checkbox, email, footer link).
- **Approvals:** "Every submit and fold needs your approval" (locked on in MVP).
- **Notify me:** email, WhatsApp.
- **Scope:** reason codes covered (13.1, 13.2, 13.3, 13.6, 13.7); fraud codes go to Chargeback Shield.
- **On / off** toggle.
- Requirements: FR-18.

### [10] Evals

**Job:** prove the AI is better than a checklist and show how it's measured.

- Headline: AI 15/15 vs checklist 8/15; 0 invented facts; fraud routed.
- Table: 16 cases × answer key, checklist, AI run, match.
- Latest automated run of the current prompt (`npm run eval`).
- Limits stated plainly.
- Requirement: FR-27.

### [11] How it works (prototype only)

One page for judges: problem in 3 lines, the screen map, the data flow diagram, what's live vs simulated, and links to the PRD, build log and repo.

---

## 4. Demo path (90-second video)

| Sec | Screen | Case | Shows |
|---|---|---|---|
| 0–10 | [1] List | all | Calls ready on arrival, sorted by money and time |
| 10–35 | [2] → [4] | C04 | Fight: reason, rule, evidence, money; cited draft; approve |
| 35–55 | [3] | C06 | Add one document → re-run → flips to Fold |
| 55–70 | [6] | C15 | Escalate: the one thing to get; defensible half |
| 70–80 | [1] | C16 | Fraud routed to Chargeback Shield |
| 80–90 | [10] | — | AI 15/15 vs checklist 8/15 |

C14 (Fold) and C10 (clear win) stay available for live demos.

---

## 5. Sources

- Razorpay, Disputes – Dashboard Actions: https://razorpay.com/docs/payments/disputes/dashboard/?preferred-country=IN
- Razorpay, About Disputes: https://razorpay.com/docs/payments/disputes/
- Razorpay, Contest a Dispute API: https://razorpay.com/docs/api/disputes/contest/
- Razorpay, Accept a Dispute API: https://razorpay.com/docs/api/disputes/accept/
- Razorpay, Agent Studio principles and guardrails: https://razorpay.com/blog/razorpay-agent-studio-principles-guardrails-and-merchant-control/
- Razorpay, Agent Studio blog: https://razorpay.com/blog/agent-studio-ai-agents-by-razorpay/
- Razorpay, Sprint 26: https://razorpay.com/sprint/26
- Razorpay, Agent Studio terms: https://razorpay.com/tnc/agent-studio/

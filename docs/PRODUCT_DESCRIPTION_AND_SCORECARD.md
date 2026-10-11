# Dispute Advisor: product description, scorecard and improvement plan

Concept prototype for the Razorpay x ISB AI PM Build Challenge, Track 2 (Recover and Grow with AI). Not an official Razorpay product.
Written 11 Oct 2026. Scores are my own judgement against the brief; I do not know the judges' weights.

---

## Part 1. The product

### 1.1 The one-line version
Dispute Advisor is an agent for Indian businesses that sell services, subscriptions or digital goods to customers abroad. When a card dispute arrives for a non-fraud reason, it reads Razorpay's dispute record and the evidence the merchant holds, applies Visa's rule for that reason code, and tells the merchant whether to **Fight, Fold (accept) or Escalate (get a document first)**, in rupees, with a response drafted so that every sentence cites a document. The merchant always decides.

### 1.2 The problem
- A merchant gets about 3 business days to respond. Miss it and the dispute is treated as accepted.
- Cross-border payments see roughly twice the dispute rate of domestic ones, and a lost international dispute is taken back at the exchange rate on the day the dispute was created, so the loss can exceed the original payment.
- Razorpay's Chargeback Shield covers fraud-coded disputes. It excludes disputes about the quality, delivery or description of goods or services. Those are exactly the disputes where the winning evidence (signed scope of work, login logs, terms-acceptance record, emails, vouchers) lives outside Razorpay.
- The merchant has no one to ask "is this worth fighting?". Our three merchant conversations confirm the pattern: the evidence sits in a cloud host, an ad platform or WhatsApp; it takes one to two days to pull together; two had a 3-day clock interrupted by a meeting or travel; one lost a winnable dispute by missing the deadline.

### 1.3 The merchant
Primary: an Indian SaaS or digital-services company (a one-person app, a six-person agency) billing US, UK, EU or Singapore customers by card through Razorpay. Secondary: service exporters on Payment Links and inbound tour operators. Physical-goods sellers are deliberately out of scope.

### 1.4 Vision
Make the dispute decision as easy as accepting a payment. Today a small exporter either ignores disputes (nearly half of small merchants never respond, per an external reference) or burns two days on a USD 150 case. The vision is a dispute desk that costs the merchant one click and one read: a priced recommendation, a draft they can trust because every line is traceable, and a deadline nudge that arrives with the work already done. Over time the merchant's own outcomes sharpen the odds, and the misses become test cases that gate every future prompt change.

### 1.5 The main USP: the Fold-or-Fight check
Most "dispute tools" only help you fight. Dispute Advisor treats **Fold** and **Escalate** as first-class calls, priced in rupees. The check compares: what you lose if you fold (amount, rupee amount taken back at the creation-day rate, fees), what you can defend with the documents you actually have, the odds, and the effort. Our merchants already work this way by hand (accept under USD 20 or 200 without looking; fight when there is a record to protect), so the product matches how they think and makes it fast and consistent.

What it produces: a call (Fight, Fold, Escalate), the plain-English reason, the Visa rule applied, the deciding documents (clickable), contradictions, missing evidence named as a specific gap, the money line, and a rough chance to win shown small and labelled as an estimate.

Why AI rather than a fixed rule: the same reason code can need opposite calls depending on what the documents say (a cancellation after the renewal, a terms acceptance that sits only in a footer, a partial refund already given). A checklist reads the reason code and the presence of documents; the agent reads the contents. On the first kill test (15 scored cases) the agent matched the human answer on 15 of 15 against 8 of 15 for the fixed checklist. On the latest run (38 scored cases, including the held-out C31 to C40) it agreed on 87% overall; on needs-judgment cases it agreed 75%, which is below our own 80% bar, and we say so on the Evals page. A second experiment tuned the rules with nine extra rules: it reached 20 of 20 on known cases but scored 6 of 10 on ten unseen cases, against 7 of 10 for the plain checklist, because each new rule broke another case.

### 1.6 Supporting features, grouped by the job they do

**A. Understand the dispute (inputs)**
- *Dispute record and payment facts.* The reason code with a plain-English name, amount in USD and rupees, time left, and what Razorpay already knows (earlier payments, refunds, 3-D Secure, earlier disputes). Job: put the facts the merchant would otherwise hunt for on one card.
- *Evidence locker.* Paste text, or upload a PDF with selectable text (read by code, no AI). Each document gets an ID (E1, E2...) and a key-document checklist per reason code ("3 of 3 key documents in place"). Job: show what is there and what is missing before any AI runs. Photos and scans need a vision-capable model and are marked as such.
- *Key facts per document.* Up to three lines per document, each backed by a word-for-word quote that code verifies. Job: let the merchant skim 8 documents in a minute.
- *Policy profile (Agent setup).* The merchant's terms and how customers accept them, on/off switch, preview of exactly what is sent. Terms are sent as the merchant's claim, never as proof; unusable terms (for example one containing a card number) are never sent. Job: give the agent the context only the merchant has, without letting a footer policy flip a call.

**B. Decide**
- *Money check.* Pure code, not AI: `p x A > (1 - p) x F + E`. Shows what you lose, what you may get back, possible fees.
- *Worth finding?* On Escalate, a code-computed ceiling on what the missing document could be worth. A ceiling, not a forecast, because nothing could validate a model estimate.
- *Clear-win fast lane.* One-click path where evidence is complete and the call is High confidence.
- *Chargeback Shield routing.* Fraud reason codes are sent to Shield with no model call.

**C. Respond**
- *Cited draft.* Within Razorpay's 1,000-character limit, each sentence ends with a source like [E1]. Editable, with a live counter.
- *Check these before you approve.* Code lists every amount, date, time, percentage and count in the draft and the document each came from; anything not found in a cited document or the dispute record is flagged. Job: the thing our merchants said they check by hand ("47 logins, I'll verify").
- *Shorten for me.* If the draft is over the limit the AI shortens it; code refuses additions of any number or source, and trims if the AI fails.
- *Bank's rebuttal.* An optional practice run where a second prompt plays the cardholder's bank, names the strongest objection and the weakest sentence, and offers a rewrite or the one document to add. Four code checks (quote is in the draft, rewrite cites real documents, fits the limit, names only real documents). It never changes the call and gives no odds. Job: make Fight a tested call rather than a confident one.
- *Evidence packet and policy patch.* A printable packet (cover summary, contents, numbered exhibits), plus a suggested terms or checkout change after a loss. Job: what two merchants said they build by hand.

**D. Approve, act, stop (merchant control)**
- Nothing is sent without a click. Review, edit, Submit, Fold, Escalate, Re-run. Submit and Fold show the exact simulated Razorpay request (`PATCH /v1/disputes/{id}/contest`, accept call). Adding or removing a document re-runs the check and shows what changed; the old answer is tagged out of date so nobody submits on a stale check.

**E. Safety (accuracy, trust, failure)**
- Nine code guardrails after every model answer. R3, R4, R5 and R8 can change the call (for example a Fight on low confidence or without a key document becomes Escalate); R1, R2, R6, R7 and R9 stop a draft (missing fields, uncited sentence, over 1,000 characters, a full card number, a number or date not in the documents).
- Evidence is data, not instructions: wrapped in tags, closing tags and disguised variants escaped, the model may call only the forced tool, and every action needs a click. One of the evals (C19) hides an instruction in a document.
- Failure path: no key, a busy model or invalid output after one retry falls back to a labelled saved result ("Saved result: <model>, prompt <version>"). The app works with no key at all.

**F. Learn and measure**
- *Results.* Recovered per rupee disputed, win rate, on-time rate, calibration of the advisor's confidence against outcomes, and "What to change next" (one suggestion whose every number is checked against the merchant's own record). Marked clearly where it shows sample data.
- *Odds blend.* The AI's estimate is blended with the merchant's own record, so a few results move it a little.
- *Dispute ratio tile.* The merchant types card payments and disputes; the tile shows the ratio against the published bands (Razorpay's blog recommends staying under 0.5%; Visa's merchant threshold is 1.5% from April 2026), attributed and hedged.
- *Missed-dispute capture.* `npm run eval:add` turns a miss into a masked candidate eval case; it only becomes a case when the builder confirms the label.

**G. Reach the merchant at the right moment**
- *Alerts and Deadline rescue.* Preview of a Slack, WhatsApp or email nudge with the response already drafted and a link that opens the review. Rules by amount and by reason (from the interviews: "$5 and $500 hit the same way"). Nothing is sent in the prototype.
- *Priority inbox.* Due-within-24h first, then the rest, Shield last; CSV export; patterns by reason code with a prevention fix.

**H. For reviewers**
- *Evals page.* 40 practice disputes (including 10 held-out cases labelled after the prompt was fixed), the agent against a fixed checklist, wrong-Fold and wrong-Fight counts, citation pass rate, injection resistance, and a release gate with launch bars.
- *How it works, tour and Under the hood.* A 14-stop tour, a pipeline view, and a drawer with model, prompt version, tokens, time, cost and raw JSON.

### 1.7 What we deliberately did not build
Fraud disputes (Shield covers them); physical-goods disputes; sending anything to Razorpay or the customer; accounts and a database (anonymous judges would see each other's outcomes); team features (assignment, internal notes); a pre-dispute checkout proof pack (changes scope, only a mock); time-budget triage (a merchant does not get enough disputes for it); Razorpay's logo.

### 1.8 External tools, data and assumptions (the brief asks for these to be stated)
- Models: Groq-hosted qwen/qwen3.8-27b and openai/gpt-oss-120b for live checks (free tier); saved ChatGPT 5.6 Terra results for the first 16 cases; the Anthropic path is built but has not been run against the real API.
- Data: all disputes and documents are synthetic, patterned on public cases (Visa's dispute guidelines, Razorpay blogs, public community posts). The exchange rate comes from the ECB feed (frankfurter) with a labelled demo fallback; the USD 600 arbitration fee is a cited value.
- Real information: Razorpay's contest API behaviour (draft then submit; no changes after submit), Chargeback Shield terms, Visa's reason-code rules, and three merchant conversations.
- Assumptions to validate on real data: that merchants' documents are available to the agent (A2); that the Visa rule table matches what banks apply; that the odds estimate is calibrated; that the overlap with Razorpay's own Dispute Responder leaves room for a merchant-side advisor (A1).

---

## Part 2. Scorecard

Two lenses, both from the brief: the five evaluation dimensions, and the seven things a Track 2 submission "should make clear". I added the submission requirements because "incomplete submissions will not be evaluated".

Constraints I am treating as fair: no Razorpay sandbox, no paid API, MBA-level primary research. Those are not penalised below. What is penalised is anything within your control.

### 2.1 The five evaluation dimensions

| # | Dimension | Score | Why |
|---|---|---|---|
| 1 | Importance and clarity of the problem | **8 / 10** | Strong: a narrow segment, a specific moment (3-day clock), a quantified loss mechanism (exchange rate on creation day), and a sharp gap (Shield excludes non-fraud service disputes). Held back by: scale. Merchants in your own interviews see 1 to 3 disputes a month, so the market is thin per merchant; and Razorpay's own Dispute Responder overlaps (you state this as assumption A1, which helps). |
| 2 | Depth of understanding of the merchant | **7.5 / 10** | Better than most MBA entries. Three merchant conversations with follow-ups on accepted and lost disputes, a Razorpay reply, a colleague's informal answer, a real warning email, and each finding is mapped to a built, proposed or rejected feature. Held back by: n = 3 and one outside the segment; intent not behaviour (the prototype walkthrough has not happened); transcripts are held privately; and the build log still says "n=0", which contradicts the evidence and costs credibility until fixed. |
| 3 | Product judgment and prioritisation | **8.5 / 10** | The kill test, the ideas you killed (retry timing by simulation, balance-due, Export Receivables), the "not built" list, Fold as a first-class call, no accounts or database, the Escalate call, and the discipline of "AI proposes, code checks, merchant decides". Held back by: breadth. About 35 features can read as a failure of focus ("focus beats breadth" is the brief's own guidance for Track 1 and the spirit carries over). The fix is presentation, not deletion. |
| 4 | How you used AI to 10x the build | **8.5 / 10** | Unusually well documented: tools, prompts, rejected outputs (the C15 economics miss, the contaminated first test, the overstated "gap"), a second AI as critic, and what you decided versus what the AI did. Held back by: a stale limitations section, no one-line statement of the speed-up, and the live model being a free Groq model rather than a frontier one (not your fault, but say it). |
| 5 | Clarity of communication (note and pitch) | **5 / 10 now, 9 / 10 reachable** | The one-pager and the video do not exist yet. The product copy and the evidence are strong, so the ceiling is high, but a missing item is a hard fail ("incomplete submissions will not be evaluated"). Today this is the single largest risk. |

### 2.2 The seven Track 2 questions

| Question | Score | Why |
|---|---|---|
| What data or signal identifies the opportunity | **8 / 10** | A dispute webhook plus the dispute record (reason code, amount, deadline) plus merchant-held evidence, with what Razorpay already knows (earlier payments, refunds, 3-D Secure). The evidence is synthetic, which the brief permits if assumptions and validation are stated (see 3.7). |
| Why AI is necessary, and what it does better than a fixed rule | **8 / 10** | You built the comparison: the checklist is code and tested; a tuned-rules experiment on unseen cases (6 of 10 against 7 of 10 for the plain checklist); the held-out run. The honest weaknesses are that the sample is small and that the agent's own needs-judgment score (75%) fails your gate. Honesty here earns more than it costs. |
| What recommendation or action the product produces | **9 / 10** | A priced Fight / Fold / Escalate call, a cited draft, a mapped Razorpay request, a document to get first with a stated ceiling value, and an alert. Not a chatbot, not an explainer dashboard. |
| What the merchant can review, change, approve or stop | **9.5 / 10** | Edit the draft, approve, fold, escalate, switch the agent off, preview exactly what is sent, a "will never do" list (send, refund, accept on my behalf), re-run, and an audit trail. Directly answers what Merchant C said: "Don't accept on my behalf. Ever." |
| How the system learns from the outcome | **6.5 / 10** | Real mechanisms: a ledger of outcomes, calibration by confidence, an odds blend with the merchant's record, missed disputes turned into eval cases, a release gate. Held back because the Results page runs on sample data, nothing retrains a model (and should not), and the loop from a lost dispute back to a prompt change is manual. A reader may call it "reporting with a few adjustments". |
| How accuracy, permissions, trust and failure are handled | **9 / 10** | The strongest area: nine code guardrails, injection defence, forced structured output with zod and one retry, a saved-result fallback that works with no key, card-number blocking, a rate limit and input cap, an honest failing gate. Held back slightly because the Anthropic path has never run against the real API, and every live result so far is from free Groq models. |
| What business outcome you would measure | **7.5 / 10** | Recovered per rupee disputed, win rate, on-time rate, ratio tile, calibration. Held back because the metric tree, targets and how you would validate on real data are spread across pages and not yet in one place. |

### 2.3 Submission requirements

| Item | Status | Score |
|---|---|---|
| Prototype (clickable or working code) | Working, labelled, no key needed, 327 tests, 26 browser suites, 12-page sweep, locked | 9.5 / 10 |
| AI build log | Detailed and honest; needs the stale "n=0" fixed and a short summary on top | 8 / 10 |
| One-page product note | Not written | 0 / 10 until written |
| 90-second video | Not recorded | 0 / 10 until recorded |

### 2.4 Overall
If the one-pager and video land at the quality of the prototype, I would put the whole at about **8 to 8.5 out of 10**, with the best scores on judgment, control and safety, and the weakest on learning-from-outcome and on proof of merchant behaviour. If either is missing or rushed, the prototype's strength will not be seen.

---

## Part 3. How to raise each score (no paid API, no cold outreach, no Razorpay contact)

### 3.1 Importance and clarity of the problem (8 to 9)
1. **One-line "dispute math" block in the one-pager**, using only public figures and your own interviews: a typical exporter's disputes per month, average amount, the share never contested, and the exchange-rate loss example (a USD 480 dispute that costs more than the payment). Mark each figure verified or assumption. About 10 minutes.
2. **A 2 x 2 positioning**: Chargeback Shield (fraud, automatic) / Dispute Responder (the processor's own tool) / Dispute Advisor (non-fraud, evidence outside Razorpay, merchant-side). Say what you add and what you do not claim.
3. **A "why now" line**: Visa's merchant threshold change (1.5% from April 2026), cross-border growth, the 3-day window, Razorpay's own August 2026 blog on service-dispute evidence.
4. **Name the scale honestly**: one or two disputes a month per merchant, so the value is the time saved and the loss avoided per dispute, not volume. This pre-empts the main objection.

### 3.2 Depth of merchant understanding (7.5 to 9)
1. **Fix the build log's "n=0"** and the line that says no conversations have been held. This is a free, immediate gain.
2. **Put the traceability table in the one-pager**: "What I heard / who / what I built or rejected" for five rows (evidence in a third party, auto-compile the packet, 3 business days, Fold on small disputes, alerts not tabs). It shows the product came from the merchants.
3. **A "Built from merchant conversations" section on How it works**, with anonymised quotes (ask each of the three for permission; they have already agreed to talk, so this is not cold). It turns the findings from your files into something a judge sees in the product.
4. **The prototype walkthrough with the same three merchants.** You said you will try. A 10-minute screen share on C06, C15 and one Fold case is enough; record the three things they did before you explained, and one thing they said they would change. Even two walkthroughs change this score more than any feature.
5. **Be exact about the limits in one sentence**: n = 3, one outside the segment, answered about described messages not the product. Judges reward that.
6. **Secondary evidence without outreach**: five to ten public posts from Razorpay's community, forums or reviews where merchants describe a lost dispute or a missed deadline, each linked and quoted in a short table. Public, free and citable.

### 3.3 Product judgment and prioritisation (8.5 to 9.5)
1. **Tier the features in the one-pager**: Core (the Fold-or-Fight check, the cited draft, merchant control), Supporting (Worth finding, Bank's rebuttal, Alerts), Convenience (the rest). A reader sees five things, not thirty-five.
2. **A "decisions and trade-offs" table with five rows**: option rejected, why, what evidence. Examples: no database or login; Fold and Escalate as first-class calls; the Bank's rebuttal never changes the call; physical goods out of scope; "submit now, mark pending" rejected because a submitted contest is final.
3. **Put "what I did not build and why" in the video's last seconds or in the note**, because the brief lists it as a scoring dimension.
4. **Do not add features.** Your lock note is the right call; the last 48 hours are for communication.

### 3.4 AI used to 10x the build (8.5 to 9.5)
1. **Fix the build log's limitations section** to match reality (conversations held, sections 1 to 11 audited and locked, the gate result).
2. **Add a five-line summary at the top**: tools used; what each did; roughly how long the build took against how long you would estimate without AI; three places you overruled the AI; one place the AI was wrong and you caught it (C15, the contaminated test, the overstated gap).
3. **Say plainly which models ran what**: Claude for building, free Groq models for the in-app live check, and why. "No paid API" is a constraint, not a flaw, once it is stated.
4. **Make the log public** (repo or a public Drive link) and test the link in a private window. The form asks for a publicly viewable file.
5. **Show one before-and-after of a prompt** (v1 to v2.3) and why it changed. Evidence of iterating on AI behaviour is what this criterion is looking for.

### 3.5 Clarity of communication (5 to 9)
1. **One-pager skeleton, one page, in this order**: the problem in two lines; the merchant in two lines; the product in a three-box diagram (read, decide, act with approval); the USP; the evidence it works (kill test, held-out run, interviews); the five decisions; success metrics; what is not built; the assumptions and how to validate. Use real figures, short sentences, one screenshot.
2. **90-second video, shot list**: (0 to 10s) the problem with the clock and a USD 480 dispute; (10 to 40s) C06: the call, the money, the cited draft, the figure check; (40 to 60s) the bank's rebuttal changes a weak sentence; (60 to 75s) C15 Escalate and Worth finding; (75 to 85s) Alerts, the rescue nudge, the merchant approves; (85 to 90s) one line on what is not built and the honest gate. Pin the exchange rate first so every number matches.
3. **Read the video script aloud once with a timer.** Ninety seconds is shorter than it feels; cut the second feature before cutting the problem.
4. **Include one honest weakness** in the note (the gate fails on two measures and nothing was tuned). It reads as confidence.

### 3.6 Learning from the outcome (6.5 to 8)
1. **Draw the loop in one picture** and put it on Results and in the note: outcome logged, calibration updated, odds blended with the merchant's record, a miss turned into an eval case, a release gate decides whether a prompt change ships. Label which steps are automatic and which are a human decision.
2. **Add a "learning, not retraining" statement**: we deliberately do not retrain on one merchant's few outcomes; we calibrate, blend and test. This is a more defensible answer than "the AI learns".
3. **Show the loop working end to end on one case**: a lost dispute, the outcome click, the change in the odds, the candidate eval case created by `npm run eval:add`, and the gate result. A 20-second clip, or a stepped screenshot in the note.
4. **Ground the sample history**: label it as sample and keep it, but add a short "from the interviews" panel with the six real disputes the merchants described (won, lost, accepted), anonymised and marked as recalled, not logged. It shows the loop against real-shaped outcomes without claiming data you do not have.
5. **State what a production version would learn from**: Razorpay's real outcomes by reason code and bank, which only it holds. That is the honest moat argument, and it belongs in the note.

### 3.7 Data or signal; why AI beats a rule (8 to 9)
1. **State the signal chain**: dispute webhook, reason code, evidence the merchant holds, what Razorpay already knows. Name which are real (the API fields) and which are synthetic (the evidence).
2. **Say how you would validate on real data in one paragraph**: run in shadow mode on a few hundred historical disputes, compare the advisor's call with what the merchant did and what happened, measure wrong-Fight and wrong-Fold rates, and compare against the fixed checklist. The brief explicitly asks for this.
3. **Put the checklist-versus-agent evidence next to one worked example**: show a case where the checklist says Fight and the agent says Fold or Escalate and why. One example persuades more than a percentage.
4. **Lead with the head-to-head numbers on the cases the agent had not seen** (C31 to C40), not the first 16, and keep the failing gate visible.

### 3.8 Accuracy, trust and failure (9 to 9.5)
1. **A one-table "what can go wrong and what stops it"**: wrong call, invented fact, injected instruction, missed deadline, no key, model busy, card number in evidence. Each row points to a guardrail by number. All of this already exists; the table makes it visible in a minute.
2. **State the open item plainly**: the gate fails on needs-judgment (75% against 80%) and first-try citations (83% against 90%); the safety rules catch the uncited cases before the merchant sees them; nothing was tuned to hide it.
3. **If you want to close the gap without a paid API:** write ten fresh unseen cases with your own labels (the `eval:add` flow is built), run them on the free Groq model once, and only then try a prompt change. Do not tune on C31 to C40, because they are now your held-out set.

### 3.9 Business outcome measured (7.5 to 9)
1. **A metric tree in the note**: north star "net dispute value recovered per month"; drivers: share of disputes answered on time, win rate on Fight calls, wrong-Fold rate; guardrails: wrong-Fight rate, citation failures, time to decision. One target for each, labelled as target, not result.
2. **Define the two numbers you could measure in a pilot**: time per dispute (today: about 18 hours over two days in your interview; target: under 30 minutes) and answered-on-time rate (today: the merchants answered all theirs but one lost to the clock; the external reference says nearly half never respond).
3. **Say what the sample Results page is**: a demonstration of the mechanism, not a result. Keep that label.

### 3.10 Prototype and submission hygiene (9.5 to 10)
1. Test the public link in a private window on a phone before submitting.
2. Pin `FX_RATE_INR_PER_USD` so the video and the product agree.
3. Check that the repo is public and contains no keys (done once; check again after the last push).
4. Submit with time to spare, not in the last hour. The form is final; the brief says no changes after submitting.

---

## Part 4. A realistic order of work for the remaining time

1. Fix the build log (n=0, limitations, five-line summary). 20 minutes.
2. One-pager: use the skeleton in 3.5. 90 minutes, including one screenshot and the traceability table.
3. Merchant walkthrough, if you can get even one. 30 minutes.
4. Video: script, pin the rate, record on C06 and C15, cut. 2 hours.
5. Final checks (3.10) and submit on 12 October if possible.

# Product evaluation: Dispute Advisor (9 Oct 2026)

Scope: the product only (the app at commit 91d8eea on `main`), not the one-pager, video or build log. Method: built and ran it with no API key, walked every route at 1280 px and 390 px, ran edge-case probes, read the 30-case eval results, and scored it against the Track 2 brief and rubric items 1 to 3. Not tested: a real Claude run, real iPhone, Safari, Firefox, the live Groq path from this sandbox (blocked), merchant reaction (none yet).

## Verdict

A tightly built decision product, not a chatbot or an explaining dashboard. It makes a call (Fight / Fold / Escalate), prices it in rupees, drafts a cited response, tests it against a simulated bank, lets the merchant approve, and feeds outcomes back. The weaknesses are not in the design. They are: (1) the live AI numbers are below its own launch bars, (2) every outcome and win rate is sample or browser-local, (3) with no working key the best interaction (add a document, call changes) shows a failure message, and (4) there is no merchant evidence, which the product cannot supply.

Scores (my judgement, 1 to 5): substance 4.5, function 4, usability 4.5, merchant convenience 4, novelty 4, visual polish 4, professional look 4.

## Update, 11 Oct 2026 (product frozen for submission)

What changed since this evaluation was written on 9 Oct: the gaps F2, F4, F5, F6, V1, V3 and V5 were fixed on 9 Oct (see the session log); on 9 to 11 Oct the merchant-driven features were built (named gap and customer history, "Check these before you approve" with rule R9, thin-evidence rule R8, copy a summary, evidence packet, what-if evidence, dispute ratio tile, policy patch, Alerts page); Results, Alerts, the bank test, Agent setup and How it works were redesigned; the tab order is now Disputes, Results, Alerts, Agent setup.

| Gap | Status on 11 Oct |
|---|---|
| F1 live numbers vs own bars | **Open, and now measured.** First complete 40-case run: agreement 87% (bar 85%, met); needs-judgment 75% (bar 80%, below); first-try citation 83% (bar 90%, below); wrong Fight 3% (met); Escalate 3 of 5; C15 called Fight. The release gate fails on two measures. Not tuned. See `docs/HELDOUT_TEST.md` |
| F2 no-key add-evidence message | Fixed 9 Oct |
| F3 sample and model estimates | Open by design, labelled |
| F4 C14 reason line | Fixed 9 Oct |
| F5 repeated sentences | Fixed 9 Oct |
| F6 C06 wording | Fixed 9 Oct |
| F7 simulated actions | Open by design, labelled. Alerts are previews: nothing is sent |
| F8 permissions | Open: described, not enforced. Production scopes are stated in `docs/PRODUCT.md` ("What production would need") |
| F9 synthetic cases | Open, stated on Evals. C21 to C40 were drafted by the builder's AI assistant; C31 to C40 labels are AI-drafted notes the builder agreed with |
| V1 Evals and How it works density | Evals folded earlier; How it works rebuilt on 10 Oct around one picture, grouped rules and a learning loop |
| V4 FX rate | Open: pin `FX_RATE_INR_PER_USD` before recording |
| V5 Escalate colour | Fixed 9 Oct (indigo) |
| V6 real devices | Open: your check |

Scores after the changes (my judgement, 1 to 5): substance 4.5, function 4, usability 4.5, merchant convenience 4.5, novelty 4, visual polish 4.5, professional look 4.5. Function stays at 4 because live accuracy is below two of its own bars and a free mixed-model chain is the only live path; the product says so on Evals.

## 1. Substance, function, usability, convenience, novelty

What works (verified):
- Decision first. Each dispute opens on one call, one sentence, three numbers (at stake in rupees, chance to win, time left) and two buttons. The call chip is visible without scrolling on a phone.
- Fold and Escalate are first-class, not fall-throughs. C15 (accepted policy meant only half was owed) is the proof case. The saved run and the two earlier Qwen runs Escalate it; the 11 Oct complete run called it Fight (answered by the backup model), which is the weakest point in the live numbers.
- Every draft sentence cites a document; nine checks run in code (R1 to R9; R3, R4, R5 and R8 change the call); results are shown and reviewer material sits apart from merchant material.
- Merchant control: nothing is sent without a click; Accept (Fold) and Submit have confirmation dialogs that say the action is simulated; terms the merchant writes are read as a claim, never as proof.
- Add or remove evidence re-runs the check, scrolls to the new answer and shows a "call changed" banner. Card numbers are refused, text is capped at 4,000 characters, hidden instructions were resisted in all eval cases.
- Bank's rebuttal (practice run against the likely bank objection) is a real differentiator: it makes Fight a tested call.
- Results page closes the loop: recovered per rupee disputed, win rate, advisor calibration by confidence, a suggested change from counts only.
- The Evals page is honest: a checklist baseline on the same cases, tuned rules failing on unseen cases, limits stated, bars shown red when missed.

Gaps, by severity:

| # | Severity | Gap | Why it matters | Suggested fix |
|---|---|---|---|---|
| F1 | High | Live headline numbers miss two of the product's own bars. Latest complete run (11 Oct, 40 cases, prompt v2.3): agreement 87% (bar 85%, met), needs-judgment 75% (bar 80%, below), first-try citation 83% (bar 90%, below), wrong Fight 3% (met). Escalate 3 of 5, and C15 was called Fight. Mixed free models, one run per prompt. Earlier 30-case figures (86%, wrong Fight 7%, citation 77%) are superseded | A judge will read the red badges first; the story "AI proposes, code checks" carries it, but the claim "ready to trust" is not earned | Keep the disclosure. Say in the pitch that the gate blocks launch and what the next step is. Optional: one more run after the key-facts fix. Do not tune on C15/C18/C23 |
| F2 | High | With no working key, adding a document shows "We couldn't run the check. Decide manually." beside the old Fight marked "Out of date" (probed on C13) | The signature interaction looks broken. If Groq is rate-limited when a reviewer arrives, they see this | Separate the two cases: "Live check is not switched on in this demo. The call above is a saved result" versus a real failure. Verify `/api/llm-status` on production before submission |
| F3 | Medium | Odds, recovered amounts and the 24 past disputes are sample or model estimates; outcomes are stored in the browser only | Cannot show a measured result; the page labels it correctly | Keep labels. Say clearly that the mechanism is built and the data is not |
| F4 | Medium | C14 shows 80% chance to win with a Fold call, and a "numbers say fighting could pay" note | Looks self-contradicting without the reason | Add one line on why the call is Fold despite the odds (what blocks the fight) |
| F5 | Medium | Live small models can produce a draft that repeats the same uncited sentence; code catches it only through R2 after the fact | A reviewer who sees one degenerate draft will doubt the pipeline | Add a code check for repeated sentences, auto-trim, then Shorten |
| F6 | Medium | Saved wording for some cases is awkward (C06 "Considering cancellation is not a cancellation") | Is the first thing a reviewer sees on the tour | Hand-edit the saved headline or label it as a prior model's wording |
| F7 | Low | Deadline rescue is a preview, no real messaging; Escalate message is copy-only; submit is simulated | By design and labelled | Keep labels |
| F8 | Low | Single user, browser state, no sign-in or roles, so the permissions story is "what the agent will and never will do" rather than real scopes | Fine for a prototype; the brief asks about permissions | State the production scopes in the pitch (read dispute, read documents, write draft; submit only on approval) |
| F9 | Low | 16 demo cases, all synthetic; the prompt was shaped on the same cases | Overfit risk, already stated on Evals | Keep the limits section |

## 2. Visual polish and professional look

What works: the Razorpay-dashboard-like shell (black top bar, breadcrumb, tabs) with a clear "Concept, not an official product" banner; one type scale, consistent card pattern, solid call colours with text labels (not colour alone); clean whitespace; the dispute page reads in about five seconds; no sideways scroll at any width tested; phone layout keeps the primary action in a sticky bar (checked in a real viewport; the overlap seen in a full-page screenshot is a screenshot artifact).

Gaps:

| # | Severity | Gap | Fix |
|---|---|---|---|
| V1 | Medium | Evals and How it works are long and dense (Evals about 2,000 px at desktop, many tables); it is the page a reviewer reads, and it is text-heavy | Keep the top result card and C15; fold the rest further, or add one small chart of agent vs checklist |
| V2 | Low | The dispute page is a narrow column, so breadcrumb and content do not share a left edge (left on purpose) | Align the breadcrumb to the column |
| V3 | Low | Evals column header still lists `gpt-oss-20b 12` after the model was removed from the chain | Add "removed after this run" or hide it |
| V4 | Low | Footer on Results says "Rate: ₹88 per USD is a demo value" when the rate API fails; fine on production, but pin the live rate before the video | Pin `FX_RATE_INR_PER_USD` |
| V5 | Low | Visual identity is plain: no illustration, no chart on the main screens, one emphasis colour for Escalate (red) that reads like an error | Optional: amber or purple for Escalate (a brand decision, left to you) |
| V6 | Low | Still unchecked on real iPhone, Safari and Firefox | Your check |

## 3. Does the product justify the Track 2 brief?

| Brief item | Where the product shows it | Strength |
|---|---|---|
| Data and signal used | Razorpay's dispute record (reason code, amount, deadline) plus merchant documents (contracts, logs, emails) and the merchant's terms | Strong; documents are synthetic |
| Why AI, not a fixed rule | Per-dispute checklist line; Evals: checklist 8 of 15, agent 15 of 15 on the saved run, 33 of 38 on the latest live run (11 Oct) vs checklist 23 of 38; tuned rules 6 of 10 on unseen cases | Strong, with honest limits |
| Recommendation or action | Fight / Fold / Escalate, cited draft, message to send, bank test, Worth asking | Strong |
| What the merchant can review, change, approve, stop | Edit draft, override call, confirm dialogs, agent on/off, "will never" list, nothing sent without a click | Strong |
| How it learns from the outcome | Mark Won or Lost; odds shift on your record; calibration table; suggested change; download of misses as candidate eval cases | Good in mechanism; no real outcomes; browser-local |
| Accuracy, permissions, trust, failure handling | Nine code checks (R1 to R9), injection and card-number blocks, saved-result fallback with label, eval gate, rate limit | Strong on trust and failure; accuracy is below own bars; permissions are described, not enforced |
| Business outcome measured | Recovered per rupee disputed, win rate, on-time rate | Mechanism built, sample data only |

Rubric items 1 to 3 (product side):
1. Importance and clarity of the problem: clear. Non-fraud card disputes on international sales are not covered by Chargeback Shield; the money at stake is shown in rupees. Gap: no measured size in the product.
2. Depth of merchant understanding and current behaviour: shown in the product by the evidence slots per reason code, the terms box, the point that merchants decide on deadlines, and "Deadline rescue". Gap: three merchant conversations (n=3, all won their disputes, one outside the target segment; see `docs/MERCHANT_FINDINGS.md`), which changed what was built on 9 Oct.
3. Product judgment and prioritisation, including what was left out: strong. Scope is explicit (no fraud, no real submission, no accounts, no pre-dispute alerts), Escalate is a real call, the rebuttal test is optional, and "Where it could go next" is labelled not built. Gap: the star features are only as credible as the live accuracy (F1).

Guidance check ("not a generic chatbot or an explaining dashboard"): passes. It decides, drafts and gates; the only explanation is on reviewer pages.

## 4. Fix order before the freeze (10 Oct)

1. F2: a clear no-key message (about 20 minutes, then re-test the browser suites).
2. Verify `/api/llm-status` on production (commit 91d8eea or later) and pin the FX rate near 12 Oct.
3. F4 and F6: one line on C14, hand-edit the C06 saved headline.
4. V3 and V2: two small changes.
5. F5 only if there is time.

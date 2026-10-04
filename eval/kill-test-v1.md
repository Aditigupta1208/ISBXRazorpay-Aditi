# Kill test v1 (4 Oct 2026)

Question: on realistic non-fraud disputes, does an AI make better Fight / Accept / Escalate decisions than a fixed checklist?

## Method

- **Cases:** 16 (`data/cases.json`). Each scenario is patterned on a public source (Visa Dispute Management Guidelines, Razorpay blogs, public merchant stories); the documents inside each case are synthetic. 15 are scored; C16 is a fraud-code scope test.
- **Answer key:** set by the builder from Visa's rules (`data/labels.json`). A second AI reviewer (ChatGPT 5.6, fresh chat, `prompts/second-reviewer-v1.md`) was used only to flag disagreements; the builder decided those cases.
- **Checklist baseline:** a fixed rule per reason code that sees only which document types are attached, never their content (rules in `data/labels.json`).
- **Test run:** prompt v1 (`prompts/dispute-agent-v1.md`) in a fresh ChatGPT 5.6 chat, outside the project where the test was designed (`data/prerun/kill-test-v1-chatgpt.json`).
- **Fact check:** every draft checked claim by claim against its case by a different model (Claude).
- An earlier run in a Claude chat that knew the test design is kept for comparison only (`data/prerun/kill-test-v1-claude.json`).

## Results

| Measure | Result |
|---|---|
| AI decisions matching the answer key | 15/15 |
| On checklist-friendly cases (7) | 7/7 |
| On cases needing judgment (8) | 8/8 |
| Checklist decisions matching the answer key | 8/15 |
| AI named the right deciding evidence | 15/15 |
| Drafts with an invented fact | 0 of 8 |
| Fraud case routed to Chargeback Shield | Yes |
| Earlier Claude run (knew the design) | 14/15 |
| Second reviewer agreement with the answer key | 14/15 |

## Findings

- The checklist cannot say "Escalate" and cannot read content, so it fails exactly where judgment is needed (C02, C05, C08, C09, C12, C14, C15).
- **C15:** the second reviewer, which only applied Visa's rules, said "Accept" on a USD 3,200 dispute where the accepted policy meant only 50% was due. The product prompt said "Escalate". Weighing economics matters.
- **C09:** the AI caught an error in the case notes (5 posts were under the agreed length, not 4).
- Drafts were accurate but only one sentence long. Prompt v2 fixes this.

## Limits

The cases are short and cleanly written, only 15 are scored, and the model was given Visa's rules. This shows the AI applies the rules to written evidence and knows when to escalate or route; it does not prove real-world win rates.

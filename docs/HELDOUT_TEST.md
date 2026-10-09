# Held-out test (v1): ten new cases, labelled by you

Purpose: measure the advisor on cases that were never used to write or tune a prompt, rule or label. The cases are in `eval/heldout/heldout-v1.json`. They are made up (drafted by the AI assistant on 9 Oct 2026), so they are not public cases. **The labels must be yours.** My proposed labels are in `eval/heldout/proposed-labels.md`. Do not open that file until you have written your own.

## Rules of the test (frozen before any run)

1. You label first, alone. I do not change a case after you have labelled it.
2. Run once with the current prompt (v2.3) before any change. That number is the honest one.
3. Rule R8 (below) is defined now and built after your labels. It was written without seeing the run.
4. If I change the prompt or the rules after the first run, the cases that drove the change are marked "used for tuning" and reported separately. The held-out result is the first run only.
5. Report whatever comes out, including a wrong-Fight rate above 5%.

## Rule R8 (thin evidence), frozen text

If the call is Fight and none of the documents the draft cites is a key document for that reason code (the per-reason list already in the app), the call becomes Escalate with the message "Your evidence does not include the key document for this reason." Key documents per reason are in `lib/evidenceChecklist.ts`. The rule only lowers a Fight. It never creates one and never changes Accept or Escalate.

Built 9 Oct, before any live run. First scan of the saved demo cases: only C12 (a correct Fight) was lowered, because the saved answer filed the checkout acceptance under Terms and Conditions. The 13.6 key list was widened to count accepted terms (a known case, not a held-out one), which can only turn a lowering into a pass. After that change R8 lowers none of the 16 saved results.

## What you need to label (skills)

No payments or legal expertise is needed. You need to read about 6 short documents per case and apply four questions. Allow 5 minutes a case, about 50 minutes in total. If you can, ask one other person (a friend, a merchant) to label the same ten blind, and note where you disagree. That is useful evidence in itself.

## The labels

| Label | Choose it when | Typical sign |
|---|---|---|
| **Fight** | The documents contradict the customer's claim and the merchant can show it. | A signed or ticked acceptance, a usage or delivery log, a refund already processed, an approval from the customer. |
| **Accept** (Fold) | The documents confirm the customer, or the merchant's own record admits the problem, or there is nothing to fight with. | A cancellation the merchant's own log shows, a refund the merchant promised and never made, a policy shown only in a footer. |
| **Escalate** | The right call depends on a document or fact the merchant does not have yet but could get in time, or only part of the amount is worth fighting. | Proof of receipt is missing, part of the work was delivered and part was not. |
| **Route to fraud cover** | The reason code is a fraud code (10.x). | Only reason code 10.x. |

For each case also write the **deciding evidence**: the one to three documents (E1, E2…) that decide it. For Escalate, write the document that is missing.

## Questions to ask yourself, in order

1. Is the reason code 10.x? If yes, label Route to fraud cover.
2. What exactly does the customer claim, and which document answers it?
3. Is there a document that clearly proves the customer wrong (Fight) or right (Accept)?
4. If not, is there a document the merchant could still get before the deadline that would settle it, or is only part of the amount contestable? (Escalate)

## Rule card (Visa reason codes in these cases)

- **13.1 Services not received:** the merchant must show the customer got or used the service (login, usage, check-in). Proof that something was sent is not proof it was received.
- **13.2 Cancelled recurring:** the merchant must show the customer did not cancel before the charge, or that the terms were accepted and the cancellation was too late. A cancellation the merchant's own log shows means the charge was wrong.
- **13.3 Not as described:** compare what was promised in writing with what was delivered, and what the customer approved.
- **13.6 Credit not processed:** a refund that is processed and shown by Razorpay is the answer. A promised refund that was never made is not defensible.
- **13.7 Cancelled services:** the merchant needs a policy the customer saw and accepted at purchase, and a cancellation that falls under it.

## The ten cases

| ID | Reason | USD | Short description |
|---|---|---|---|
| C31 | 13.1 | 1,800 | Online course; customer says no access. |
| C32 | 13.1 | 2,400 | Tour voucher; customer says never received. |
| C33 | 13.2 | 540 | Annual SaaS renewal; customer says cancelled in time. |
| C34 | 13.2 | 960 | Annual footage plan; customer says cancelled. |
| C35 | 13.3 | 3,000 | Translation job; customer says incomplete. |
| C36 | 13.3 | 750 | Shopify plugin; customer says not as described. |
| C37 | 13.6 | 420 | Refund issued; customer says never credited. |
| C38 | 13.6 | 630 | Refund promised by email; customer says never sent. |
| C39 | 13.7 | 1,500 | Villa booking cancelled two days before check-in. |
| C40 | 10.4 | 1,100 | Customer does not recognise the charge. |

Full text of each case is in the JSON file. Open it, or ask me to print them as a document.

## Your label sheet (fill in)

| ID | Your label | Deciding evidence (or missing document) | Unsure? (Y/N) |
|---|---|---|---|
| C31 | | | |
| C32 | | | |
| C33 | | | |
| C34 | | | |
| C35 | | | |
| C36 | | | |
| C37 | | | |
| C38 | | | |
| C39 | | | |
| C40 | | | |

## After you label

1. Send me the filled sheet. I add the cases to `data/cases.json` and your labels to `data/labels.json` as "Held-out, confirmed by the builder".
2. I build R8, then you start the GitHub Action once for prompt v2.3 as it is.
3. We read the result together and decide what, if anything, to change. Anything I change is reported as tuned.

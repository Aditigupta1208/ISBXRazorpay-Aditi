# Visual and usability audit (9 Oct 2026)

Who this is for: an Indian merchant who sells services, subscriptions or travel abroad, has a few disputes a month, and opens this between other jobs with a deadline of hours or days.

How it was done: every page at 1280 px and 390 px in saved-result mode, plus the states a merchant moves through on C01 (rows open, review, bank test, confirm), plus the live results pasted during testing. Not covered: Safari, Firefox, a real iPhone, a screen reader, the tour overlay.

## Verdict

The product is already clearer than most dispute screens. The first screen of a dispute answers the four questions a merchant has (what should I do, why, how much, by when) in under five seconds, and the headline is plain language ("Get one document before you decide"). The weaknesses are not polish; they are **priorities on the page**: reviewer material sits inside the merchant's decision path, the list does not sort by what is urgent, and the first thing a visitor sees on most disputes says "saved result, ChatGPT, prompt v1" instead of the live product.

## What works (keep)

- Hero card on a dispute: call chip, plain headline, one line of reason, three numbers (at stake, chance, time left), one "worth it" badge, then the actions. Read in one glance.
- Plain-language headline per call. Rupee values in Indian grouping and lakh notation, with the dollar amount beneath.
- Honest labels everywhere: "an estimate", "Saved example, written by the builder", "Simulated: nothing is sent". Trust is earned by saying what is not real.
- Colour is never the only signal: every chip has an icon and a word.
- Escalate card: "Get this first", a message ready to copy, and the cost of waiting. This is the most useful screen in the product.
- Results opens with a sentence, not a chart: "When the advisor said Fight with high confidence, you won 9 of 10."
- Consistent cards, radius, spacing and type (Inter). No horizontal scroll at 390 px.

## Findings, in the order I would fix them

### P1: fix before the freeze (small changes, big effect)

| # | Where | What I saw | Why it matters | Fix |
|---|---|---|---|---|
| 1 | Evals | "The new Claude run is not done yet", "Agent v2.2 (automated): Not run yet", while the live app runs a free model. The only scored result is the old ChatGPT prompt-v1 run. | The page that answers "can I trust it?" says the live product has not been measured. A reviewer will read that as an unproven build. | Run `npm run eval` on your machine, commit the results, and reword "Claude run" to "live model run". |
| 2 | Dispute, first impression | Most disputes open on "Saved result: ChatGPT 5.6 Terra, prompt v1" in small grey text; Re-run check is a secondary button. | A reviewer can think the product is a static mock. The live feature is hidden behind a click. | Say "Prepared in advance" in a visible pill and make "Run live check" the primary action while a saved result is showing. **Done 9 Oct.** |
| 3 | Disputes list | The blue intro card takes 340 px, so only three rows show on a 900 px screen. | A returning merchant wants the queue, not the pitch. | Collapse it to one line after the first visit (it already has Hide; remember the choice and start collapsed on repeat). **Done 9 Oct.** |
| 4 | Disputes list | Row order looks random: 20h, 18h, 14h, 8h, then 44h, 2d, 40h, 2d, 30h. It is "due soon first, then by rupee amount", which the page says only in small text. | Triage by deadline is the merchant's main job. An order they cannot predict costs trust. | Sort by deadline by default, with sortable column headers (Time left, Amount). **Done 9 Oct.** |
| 5 | Dispute page | Six accordions of equal weight: Evidence, Timeline, The money, Why AI not a checklist, What Visa's rule means, Safety checks. Two of them (Why AI, Safety checks with R1 to R7) are for reviewers. | They sit in the merchant's decision path and make the page feel like a pitch. | Keep Evidence, Timeline, The money and Visa's rule together. Move "Why AI, not a fixed checklist?" and "Safety checks" into a labelled "For reviewers" group below, or into Under the hood. **Done 9 Oct.** |

### P2: worth doing if time allows

| # | Where | What I saw | Fix |
|---|---|---|---|
| 6 | Buttons | "Fold" is the button label on a Fight card. A new merchant may not know it means "accept the dispute and take the loss". | "Accept dispute (Fold)". Same for Escalate. **Done 9 Oct.** |
| 7 | Evidence cards | Monospace tags like `term_and_conditions`, `access_activity_log`. | Plain labels: "Terms and conditions", "Login and usage log". Keep the raw name in Under the hood. **Done 9 Oct.** |
| 8 | Escalate card | "Worth finding? Up to ₹63,360 more is still at risk at today's 55% odds, out of the ₹1,40,800 you could contest. More than the ₹500 effort cost we assume…" is three lines of arithmetic. | One line: "Worth asking: could save up to ₹63,360." Put the working behind "How we got this". **Done 9 Oct.** |
| 9 | Phone, Escalate | The actions ("Copy the message", "Add the document", "Fight anyway", "Fold") are about two screens below the call. | A sticky action bar on phones, as many merchants will check on mobile. **Done 9 Oct.** |
| 10 | Results | "What to change next" (the actionable part) is at the bottom, under four analytics blocks. | Move it up under the headline sentence. **Done 9 Oct.** |
| 11 | Results | Bars are green or brown with no legend. | Add a one-line legend ("green: won 75% or more") or use one colour. **Done 9 Oct.** |
| 12 | Safety checks | Rule IDs (R1 to R7) mean nothing to a merchant. | Show the rule in words; keep the IDs for reviewers. **Done 9 Oct.** |

### P3: polish

- Breadcrumbs differ by page ("Razorpay Dashboard › Transactions › Disputes › Dispute Advisor", "… › Agent Studio › Dispute Advisor setup", none on a dispute). Pick one pattern.
- The list is 1,130 px wide and a dispute is 820 px, so the page jumps in width when you open one. Intentional for reading, but it shows.
- A lot of helper text is 12 px grey. It passes contrast but is small for a tired reader. Move helper text to 13 px.
- Agent setup: the Deadline rescue preview is faded with a pale button, which looks disabled. Add a "Preview" tag.
- Red is used for Escalate and orange for deadlines. Red often reads as "bad". Consider amber or blue for Escalate. This is a brand-palette decision.
- The 👍 👎 emojis are the only emoji in an otherwise icon-free interface.
- List footer ("Calls are saved results from an earlier test run, so this list works without an API key") is technical. "These calls were prepared in advance. Open a dispute to run a live check."

## Is it designed for a merchant? (the PM view)

| Question | Answer |
|---|---|
| Can a busy merchant act in under a minute? | Yes on a dispute: the hero gives the call, the reason, the money and the deadline. No on the list: the order and the pitch card slow triage (P1 #3, #4). |
| Does it use their words? | Mostly: dispute, evidence, deadline, refund. The product's own words (Fold, Escalate, Call, Fold-or-Fight check, slot names, R1 to R7, prompt version) leak into buttons and tags. The headlines translate them well; the buttons do not. |
| Does it make the next step obvious? | Yes on Escalate and on Fight (one primary button). Less so when a saved result is showing: the live action is secondary (P1 #2). |
| Does it earn trust? | Strongly. Every claim cites a document, limits are stated, nothing is sent without a click. This is the best part of the design. |
| Is it for one audience? | No. Merchant screens and reviewer material share the same page. Separating them (P1 #5) is the single biggest clarity gain. |
| Is it usable on a phone? | Yes, no sideways scroll, readable type. The Escalate actions sit too low (P2 #9). |
| Gaps a real launch would have to close | Bringing documents in from the merchant's own systems (out of scope here), real outcome data instead of sample history, per-merchant login. |

## What I would do with the remaining time

Fix P1 #1 first (it needs your machine and the free daily allowance), then #2, #3, #4 and #5, which are code-only and low risk. P2 and P3 only if there is time after the note and video.

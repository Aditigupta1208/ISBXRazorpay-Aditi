# DESIGN.md: Dispute Advisor prototype

Look, feel and writing rules. Read with `docs/pm/04-screens.md` (what each screen does) and `docs/pm/05-data-and-stack.md` (how it works). Status: draft v2, checked against screenshots of Razorpay's Agentic Dashboard demo and the classic dashboard (see `04-screens.md` section 1.4). The screenshots show no Disputes page, so dispute-specific components are our own.

## Principles

1. **Feels like it belongs in the Razorpay dashboard.** Left sidebar, light content area, blue accent, familiar labels (Transactions, Disputes, Accept Dispute, Contest & upload evidence). Do not use Razorpay's logo or wordmark.
2. **The call comes first.** On every dispute, the first thing the eye lands on is the call (Fight, Fold or Escalate), then the reason, then the money.
3. **Show the reasoning, not just the answer.** Rule, deciding evidence, and money are always visible next to the call.
4. **Nothing happens without a click.** Every action is a button with a confirmation; simulated actions are labelled as simulated.
5. **Plain words.** Dispute, evidence, deadline, refund. Not "adjudication", "representment", "verdict".
6. **Never colour alone.** Every status has text and an icon.

## Required labels

- Top banner on every page, always visible: **"Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product."**
- Result source on every check: **Live** or **Saved result: <model>, prompt <version>**.
- Odds always labelled **AI estimate**.
- Exchange rate always labelled **demo rate**.
- Simulated actions labelled **Simulated: not sent to Razorpay**.

## Observed in Razorpay's screens

- **Classic dashboard:** dark navy left sidebar with light text, white content area, blue primary buttons, green pill for success states ("Processed"), table with filters above, right-side detail panel, "Live Mode" toggle in the top bar.
- **Agentic Dashboard:** dark top bar with an underline on the selected item, soft pastel gradient only on the home screen, white rounded cards, large bold answer headlines, thumbs up, thumbs down, copy and share icons under every answer, blue send and primary buttons, numbered "How can I help you next?" list.
- **Forms:** label above input, grey helper text under the field, Cancel (outline) and a blue primary button at the bottom of the dialog.
- We follow these patterns for the layout, buttons, pills and dialogs. We do not copy the Ray mark, the Razorpay logo or their screenshots.

## Colour tokens (Tailwind `theme.extend.colors`)

Values marked **sampled** were measured from the pixels of Razorpay's Agentic Dashboard screenshots; the rest are ours. All text pairs meet WCAG AA.

| Token | Value | Source | Use |
|---|---|---|---|
| `nav` | `#010101` | sampled | Top navigation bar |
| `nav-ink` | `#E8E8E8` (selected `#FFFFFF`) | ours | Navigation text |
| `canvas` | `#F9F9F9` | sampled | Page background |
| `surface` | `#FFFFFF` | sampled | Cards, dialogs, input |
| `line` | `#EAEAEA` | sampled | Card and field borders |
| `ink` | `#000000` | sampled | Headlines and body |
| `ink-soft` | `#656769` | sampled | Placeholder and secondary text |
| `helper` | `#808180` | sampled | Helper text under fields, small labels |
| `brand` | `#407AEA` | sampled | Primary buttons, links, selected tab |
| `brand-focus` | `#4D72BE` | sampled | Focused input border |
| `brand-soft` | `#E8F0FE` | ours | Citation chips, selected evidence |
| `row-hover` | `#EAEAEA` | sampled | Highlighted row in the next-steps list |
| `green` | `#4BA66F` | sampled | Success accents, selected-tab glow |
| `green-ink` | `#3D6A51` | sampled | Success text ("Payment link created" style) |
| `home-mint` | `#EBF9E5` to `#F4FBF2` | sampled | Soft gradient on the home screen only |
| `fight` / `fight-soft` | `#0F7B4F` / `#E3F5EC` | ours | Fight chip |
| `fold` / `fold-soft` | `#8A4B08` / `#FDF0DC` | ours | Fold chip |
| `escalate` / `escalate-soft` | `#B42318` / `#FDE8E6` | ours | Escalate chip |
| `shield` / `shield-soft` | `#475569` / `#EEF2F6` | ours | "Chargeback Shield" (not our call) |
| `warn` | `#B54708` | ours | Under 24 hours left |
| `proto-banner` | `#FFF4CC` on `#5C4400` text | ours | Prototype disclaimer bar |

## Typography

- Font: Inter (via `next/font`), fallback system sans.
- Sizes: page title 24/32 semibold; section title 16/24 semibold; body 14/22; small 12/18; money figures 20/28 semibold, tabular numbers.
- Numbers use `font-variant-numeric: tabular-nums`.
- Reason codes in a mono style only where shown as a code (`13.2`).

## Layout

Matches the Agentic Dashboard shell from the screenshots.

- **Top bar:** black, about 60px high, items Ray AI, Payments (selected, with a soft green glow underline), Banking+, Payroll, More, and a dark rounded search field on the right ("Search in payments"). Under it, a white sub-tab row with underline on the selected tab: Transactions, Settlements, **Disputes**, Refunds. *Where Disputes sits in the new navigation is not visible in the screenshots; Payments is our assumption.*
- **Prototype banner** above the top bar on every page.
- **Page:** centred column, max width 1180px, 24px side padding (16px on phones). Cards are white with a 16px radius and a 1px `line` border.
- **Dispute list:** three summary cards, then one table card.
- **Dispute detail:** header card; below it two columns (case on the left, check on the right) above 900px, stacked below. Then the response card full width.
- **Phone (390px):** top bar and tabs scroll sideways without wrapping; evidence slot tags drop under their text; time left moves under the title; buttons wrap two per row. No sideways page scroll.
- Spacing scale 4/8/12/16/24/32. Buttons 10px radius; chips fully rounded.
- A rendered mock is in `docs/design/mock/` (list, detail and phone views).

## Components

| Component | Spec |
|---|---|
| **Call chip** | Icon + text: ✓ Fight, ↩ Fold, ⚠ Escalate, 🛡 Shield. Soft background, dark text from the token pairs above. Sizes: small (list rows), large (detail header) |
| **Call card** | Large chip, confidence ("High confidence"), one-line reason, and "Changed by safety rule" note when applicable |
| **Time left** | "2d" or "18h". Under 24h: warn colour with ⚠ and bold. Under 6h: banner "Respond now" |
| **Money block** | Rows: At stake (original currency and ₹), Taken back if lost (₹, "demo rate"), Fees at risk, AI estimate of odds, then a result line: "Fighting is worth it ✓" or "Check the money" |
| **Evidence card** | ID badge (E1), title, 2–3 lines of key facts, slot tag (`access_activity_log`), flags (Contradiction, Couldn't read, Looks like instructions) |
| **Citation chip** | Small pill `E2` or `Razorpay`; hover or click highlights the evidence card; red underline on sentences without a source |
| **Safety check line** | Icon + one sentence per rule: ✓ passed, ↻ changed the call, ✕ blocked. Collapsed by default under "Safety checks" with a count |
| **Buttons** | Primary (brand), secondary (outline), destructive-confirm (for Fold, outline with fold colour). Primary follows the call. Disabled state explains why in a tooltip or helper line |
| **Confirm dialog** | Plain sentence of what happens and what can't be undone; two buttons: "Yes, submit" / "Cancel" |
| **Simulated request panel** | Monospace box with the exact request, header "Simulated: not sent to Razorpay" |
| **Under the hood drawer** | Right-side drawer, 420px; sections: Result source, Model and cost, Safety checks, Raw output, Audit trail |
| **Answer block** | Bold one-line finding (22/30), explanation paragraph, "My recommendation" line, then icon row: thumbs up, thumbs down, copy |
| **Next steps list** | "How can I help you next?" with 2–3 numbered options; first option highlighted on hover |
| **Review dialog** | Pre-filled, editable fields; label above, helper text under; Cancel (outline) and primary button |
| **Draft card** | White card with the draft text and a small blue **Copy** button |
| **Progress text** | Under the Re-run button: "Reading 3 documents…", "Applying Visa rule 13.2…", "Writing the response…" |

## States

- **Loading a check:** keep the previous result visible, dimmed, with progress text; never blank the screen.
- **Saved result:** label "Saved result" next to the call; no apology tone.
- **Check unavailable:** "We couldn't run the check. Decide manually." plus the rule and evidence list.
- **Empty evidence:** "No documents yet. Add what you have: contract, login log, emails, receipts."
- **Errors on add evidence:** inline, specific: "Remove the card number and try again."
- **No disputes:** "No open disputes."

## Writing rules

- Sentences under 20 words. No jargon without a plain explanation next to it.
- Use the merchant's words: dispute, evidence, deadline, refund, customer.
- Buttons are verbs: Add evidence, Re-run check, Review response, Approve and submit, Fold.
- State uncertainty plainly: "AI estimate", "Medium confidence". Never "guaranteed" or "certain".
- Money always shows the currency and the rate source.
- Do not give tax or legal advice as fact. "Ask your accountant whether…" only.

## Accessibility

- Contrast AA minimum; focus rings visible (2px brand outline).
- Keyboard: all actions reachable; dialogs trap focus and close on Escape.
- Chips and states have text and icon; no meaning from colour alone.
- Touch targets at least 44px on phones.
- Check at 360px width before every deploy.

## Do not

- Use the Razorpay logo, wordmark or copied screenshots.
- Show the API key, raw environment values, or real card data anywhere.
- Hide the prototype banner or the Live/Saved label.
- Present odds as a guarantee, or an exchange rate as a live rate.
- Add features not in `docs/pm/02-features.md`.

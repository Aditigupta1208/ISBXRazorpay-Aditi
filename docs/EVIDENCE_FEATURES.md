# 2. Evidence

- **Evidence cards:** each document shows its ID and the Razorpay evidence slot it maps to (11 slots).
- **Add evidence:** paste up to 4,000 characters, up to 5 items, with a live counter, an "n of 5 added" count, and a Remove link. The Add button is disabled at 5.
- **PDF and image upload:** up to 3 MB, with the first bytes checked. PDFs with selectable text are read directly by code (no AI, works with no key); photos and scans need the live Claude model. The merchant checks and edits the text before it is added.
- **Full card numbers blocked,** in the browser and on the server.
- **Key facts per document:** up to 3 lines each, every one backed by a word-for-word quote.
- **"What 13.x needs":** a checklist of key documents per reason code, ticked where covered, with the slot to use where not.
- **Timeline from your documents:** only full dates written in the evidence, each linked to its document.
- **Evidence-changed prompt:** the old call is dimmed and marked "Out of date: re-run the check". Progress text steps through the reading stages.
- **Per-document flags:** Contradiction, Couldn't read, Looks like instructions, each with a one-line explanation under the chip.
- **Worth finding?** For an Escalate call, how valuable the missing document would be.
- **What-if evidence:** on Escalate, what would change if the document turned up, with a deadline check.
- **Deciding document** label on the evidence card for each document the call rests on.
- **Show more** on long pasted documents (three lines until opened).
- **Remove keeps the result consistent:** removing an added document renumbers the rest and rewrites the old result's citations to match, so none points at the wrong document.

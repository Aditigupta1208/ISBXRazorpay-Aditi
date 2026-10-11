# Build log update (11 Oct 2026): replace section 5, add the summary and the new entries

Use this to bring `claude/build-log.md` up to date. Paste the "Summary" under the title, replace section 5 with the text below, add the "How the models were used" and "Prompt history" blocks to section 2, and append the dated entries at the end. Lines marked (yours) are the builder's own words to edit.

## Summary (paste at the top)

- **Tools:** Claude (claude.ai chats and Claude Code) for research, planning, review and building; ChatGPT for the clean kill test run; free Groq models (Qwen, gpt-oss-120b) for the live check inside the app.
- **What AI did:** read the brief, mapped what Razorpay ships, wrote the first PRD and the code (about 11,000 lines, 330 unit tests, 26 browser suites), ran audits section by section, and drafted cases and documents.
- **What I decided (yours):** the track and the segment; which ideas to kill; the final labels on the kill test; Fold and Escalate as first-class calls; no database or accounts; what to cut; what to say and not say about accuracy.
- **Where AI was wrong and I caught it:** a rule-only prompt that would have refunded USD 1,600 too much on C15; a kill test run in a chat that already knew the design; an overstated "gap" in held-settlement; "UPI is practically free"; POST instead of PATCH on the contest call.
- **Honest limits:** no Claude key, so live checks run on free Groq models; all disputes are synthetic; the eval release gate fails on two measures and nothing was tuned; three merchant conversations, no walkthrough of the product yet.

## Add to section 2: how the models were used

- **Building and review:** Claude Code in cloud sessions, one milestone per session, then audit sessions that read each section as a merchant would, list findings, and fix them.
- **In the product:** a forced tool call with a schema, validated with zod, one retry, then a labelled saved result. The live check runs on Groq (Qwen first, gpt-oss-120b as backup). The Anthropic path is built and tested only against a stand-in server.
- **Why not a frontier model in the app:** no paid key was available. The product is built so that a key switches the provider without code changes.

## Add to section 2: prompt history (the agent prompt)

| Version | What changed | Why |
|---|---|---|
| v1 | Applies Visa's rule for the reason code and returns Fight, Accept, Escalate or route to fraud cover. Run in a fresh ChatGPT chat on 16 cases. | The kill test. |
| v2 and v2.1 | Forced structured output, a cited draft (every sentence names a document), odds, the defensible amount, evidence flags, evidence is data and never instructions, and economics. | A rule-only prompt accepted C15 in full. The product needs the money and an Escalate call. |
| v2.2 | An Escalate call also drafts from the evidence on hand, and never claims what the missing document would show. | Escalate calls had no draft to review. |
| v2.3 | Only the Escalate rule was made specific. No case facts added and no case named. | The first full 30-case live run called none of the four Escalate cases right. |

## Replace section 5: known limitations, risks, verification steps

- **Evidence limits:** review-site data is self-selected. There is no access to real Razorpay merchant data. Three merchants were interviewed (one outside the target segment), with follow-ups on a dispute each had accepted or lost. They answered about a described message, not the product. A product walkthrough has not yet happened (update this line if it does).
- **Synthetic data:** all 40 practice disputes were written by the builder and the AI, patterned on public cases. The merchants, customers and documents are invented. The exchange rate is labelled (live, fixed or demo). The odds of winning are an AI estimate, not a measured rate.
- **Labels:** the answer key is the builder's reading of Visa's rules. C21 to C30 were first proposed by the AI assistant and are confirmed only after the builder labels them independently (see `docs/LABEL_CHECK_C21_C30.md`).
- **Verification:** every factual claim about Razorpay (contest API, deadlines, Chargeback Shield terms, clawback rate) was traced to a public source and corrected where the AI was wrong. A reply from Razorpay support (unsigned, no ticket number) and an informal answer from a Razorpay colleague are treated as indicative only.
- **Evals:** first kill test, 15 scored cases: agent 15 of 15, fixed checklist 8 of 15, no invented facts in 8 drafts. Latest complete run (11 Oct, prompt v2.3, 40 cases, 38 scored): agreement 87% against 61% for the checklist; held-out cases 7 of 8; needs-judgment cases 75% against a bar of 80%; first-try citation 83% against a bar of 90%. **The release gate fails and nothing was tuned.** An earlier run was incomplete because the free Groq limits ran out; it is kept in `eval/incomplete` and not shown as a result.
- **Why AI, not rules:** nine extra rules reached 20 of 20 on known cases and scored 6 of 10 on ten unseen cases, against 7 of 10 for the plain checklist.
- **Not proven:** Claude as the live model; saved results for C01 to C16 are still from ChatGPT prompt v1.
- **Risks and how the product handles them:** wrong AI answer (nine code checks can downgrade a Fight or stop a draft; every sentence cites a document; a figure check compares every number and date with the documents); prompt injection in evidence (wrapped and escaped, one forced tool, one test case); privacy (full card numbers blocked in evidence and draft, nothing stored on a server); budget abuse (rate limit, input caps); AI unavailable (labelled saved result, works with no key); overlap with Razorpay's Dispute Responder (stated as an assumption, not confirmed).

## Entries to append (dated)

| Date | Tool / model | Goal | Output used / rejected / edited | My decision |
|---|---|---|---|---|
| 8 to 9 Oct | Claude Code (Claude Sonnet 5.5, as configured) | Run the live check on a real model; build the backlog from the merchant conversations | Live check proven on Groq (Qwen and gpt-oss), not on Claude. Built the merchant-driven items: alerts as the front door, evidence packet, named gap, check-before-approve, figure check (R9), R8 (a Fight with no key document becomes Escalate), policy patch, ratio tile, copy summary, what-if evidence. | Order the backlog by how many of the three merchants asked for each item. |
| 9 Oct | Claude Code | Held-out test | Drafted ten held-out cases; the labels had to be mine. Read them, agreed on C31 to C40. | Labels are mine; the assistant should not grade its own cases. |
| 9 Oct | Claude | Facts check | A submitted contest is final (API page, Razorpay support reply); a dispute generally counts when raised; the 0.5% figure is a blog recommendation, not a published limit. | "Submit now, mark the rest pending" rejected. Ratio tile uses attributed figures only. |
| 11 Oct | Claude Code | First complete 40-case run | 87% against a checklist at 61%; gate fails on needs-judgment (75%) and first-try citation (83%). Found and fixed a metric bug (a correct Fight on C39 counted as obeying a hidden instruction). | Keep the failing gate visible. Nothing tuned. |
| 11 Oct | Claude Code | Audit every section (response, safety, list, results, alerts, agent setup, reviewer pages, platform) and fix every finding | Card numbers also blocked in the draft; tag escapes cannot be disguised; abbreviations no longer split sentences; the figure check reads dates, times, percentages and counts; list tiles skip folded disputes; CSV opens cleanly; ratio input parsing; damaged saved rules no longer crash Alerts; keyless `npm run eval:gate`. The first fix list for the response section was lost in a context reset and re-derived from the code; the builder's own list was then used. | Sections 1 to 11 locked. |
| 11 Oct | Claude Code and Claude | Evidence for judges | Why-AI argument with a worked example where the checklist is wrong and the agent right (C14, C05) and where the agent also missed (C12, C15); metric tree; risk table; tiers; positioning; Merchants tab; sources and assumptions; learning loop; seven interview stories kept out of every number; At a glance tab with the in-depth tabs kept; 14-stop tour. Rejected: shortening How it works, because the volume carried real content. Instead a one-screen summary was added. | I wanted a reviewer to see the argument in a minute and still be able to go deep. |
| 11 Oct | Claude Code | Product description and scorecard against the brief | Scored each evaluation dimension and each of the seven Track 2 questions; listed improvements that need no paid API and no cold outreach. | Fix what can be fixed in the product and the note; leave the rest as stated limits. |

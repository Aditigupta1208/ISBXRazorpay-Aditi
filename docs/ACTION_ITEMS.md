# Action items: product build (7 Oct 2026, 20:30 IST)

Deadline: 13 Oct 2026, 11:59 PM IST. No changes after submission. Items marked **You** need you (keys, Vercel, judgement, your own words); **Me** is code I can do.

## State of the branches

| Branch | What is on it | Merged? |
|---|---|---|
| `main` | Everything up to the polish sweep (`a73cae9`) | live at isbx-razorpay-aditi.vercel.app |
| `wip/gemini` | Gemini provider | no |
| `wip/groq` | Groq provider, R3 fix (accepts "Razorpay" as a source), model health memory, waiting notice, thinking medium, room and time scale with level | no |
| `wip/ai-features` | All of `wip/groq` plus shorten, key facts, what to change next, tour step 10, Live-or-saved section, clearer failure messages | no |

`wip/ai-features` contains the others' work that matters (Groq, the R3 fix). Gemini stays separate; it is not needed if Groq or Claude is chosen.

## 1. Decide (everything else depends on these)

1. **You: which model does the submission link use?** Options: (a) Groq `gpt-oss-120b` at `GROQ_REASONING=high`, free, fast, reads text PDFs through code but cannot read images or scans, rate-limited, C06 correct at high but wrong at medium and low; (b) Claude Sonnet, about $5 to $10 of API credit, the model the prompt was written for, accepts PDF and image uploads; (c) saved results only, no live calls. My recommendation: (b) if you will fund it, else (a) with the notice that is already built.
2. **You: say "merge"** when you are happy with `wip/ai-features`. I then merge it to `main` (fast-forward), push, and check the Vercel deploy. Merging also needs the Production environment variables (item 3).

## 2. Verify on the real model (needs you)

3. **You:** in Vercel set `GROQ_REASONING=high` for Preview and, after merging, for Production. Production already has `GROQ_API_KEY` and `GEMINI_API_KEY`; add `LLM_PROVIDER=groq` (or the Anthropic key) so there is no doubt which one runs. Redeploy after every change.
4. **You:** on the `wip/ai-features` preview, open `/api/llm-status?probe=1`, then test and send screenshots of each: Re-run check on C06 (expect Fight), C01, C15; Shorten (paste a draft over 1,000 characters); Read key facts; Suggest a change on Results; Bank's rebuttal.
5. **Me, after 4:** if a model answer fails a code check in real use, tune the prompt or the check, not the label.
6. **You + Me:** `npm run eval` on all 30 cases with the chosen live model (needs the key in `.env.local` on a machine, or I run it in a session where you add the key as a secret, never in chat). Then decide whether to replace the saved ChatGPT v1 results with the new ones. This fills the "latest prompt" column on the Evals page and answers "why AI" on the live app, not only the old kill test.
7. **You:** try the three new features with one added document and with your own policy text, to see the cache and the "evidence changed" paths.
8. **You:** test on a real iPhone (Safari) and, if you can, Firefox. I only have Chromium.

## 3. Setup and data (you)

9. Run `docs/supabase-usage.sql` once in Supabase so the anonymous counter works. Open `/usage` after to confirm.
10. Confirm the C21 to C30 labels (the answer key). The Evals page numbers depend on them.
11. Pin the exchange rate near 12 Oct with `FX_RATE_INR_PER_USD` so the video, the note and the live demo show the same numbers. Do this last.
12. Check that Disputes under Transactions in Razorpay's real dashboard matches the placement in the demo.
13. Confirm the Vercel function limit (`maxDuration` 60 s) for your plan, and that the forced tool call works on the chosen model. The `/api/llm-status?probe=1` result covers the second part.

## 4. Build (me), small and optional, in this order

14. A test-only way to skip the one-hour cache, so five Re-run presses are five fresh calls (only if you want a reliability test; the cache stays on for reviewers).
15. Saved key facts for a few more demo cases (today: C01, C06, C15). Only worth it if reviewers will open other cases without a key.
16. Update `docs/PRODUCT.md`, `docs/DEPLOYED.md` and `docs/BUILD_PLAN.md` to match what was built (the helpers, the providers, the cache, the notice), and tick the milestones.
17. Final sweep after the merge: full browser suites, contrast and tap targets on the three new components at 360 px, `npm run build`, and a check that the app works with no key at all.
18. **Freeze on 10 Oct.** After that, only fixes. Tag the final commit `submission`.

## 5. Your submission pieces (not mine to write)

19. One-page product note: by 11 Oct. It must say why AI beats a rule, what the merchant controls, how it learns (be honest: sample data, no training), accuracy and failure handling (guardrails R1 to R7, saved-result fallback, the C06 model finding), the business metric, and what you left out.
20. 90-second video: by 12 Oct. Show the problem, one dispute end to end (C06 flip or C15 Escalate), Bank's rebuttal, and the label that says live or saved.
21. AI build log (public): make the final copy. Add today's items: Groq and Gemini tried, the cache you spotted, the R3 bug, C06 flipping with thinking level. Pick one headline example of an AI output you rejected or corrected (the build log lists candidates A to G).
22. Merchant conversations: even two or three quotes, or a plain statement that you used public sources and how you would validate. This is the weakest rubric area.
23. Submit through the form in the brief by 13 Oct 11:59 PM IST. Do it on the 12th if you can; no changes after.

## Suggested calendar

| Day | Do |
|---|---|
| 7 to 8 Oct | Decide the model; test `wip/ai-features` (items 1 to 4, 7); say "merge" |
| 9 Oct | Eval run (6), Supabase (9), labels (10), small build items (14 to 16) |
| 10 Oct | Final sweep (17), freeze (18) |
| 11 Oct | One-pager (19) |
| 12 Oct | Video (20), pin FX (11), build log (21) |
| 13 Oct | Buffer, submit (23) |

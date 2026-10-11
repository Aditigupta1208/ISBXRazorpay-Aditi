# Feature lock: sections 1 to 11

Locked on 11 Oct 2026 (evening). From here, change these sections only to fix a bug found by a real person; do not add features.

| Section | What it covers | Feature doc |
|---|---|---|
| 1 Core | Fold-or-Fight check, money, history | `docs/CORE_FEATURES.md` |
| 2 Evidence | Documents, uploads, flags, key-document checklist | `docs/EVIDENCE_FEATURES.md` |
| 3 Response and approval | Draft, figure check, bank test, submit, fold, packet | `docs/RESPONSE_FEATURES.md` |
| 4 Safety checks | R1 to R9, injection defence | `docs/SAFETY_FEATURES.md` |
| 5 Disputes list | Tiles, order, filter, CSV, patterns | `docs/LIST_FEATURES.md` |
| 6 Results | Headline numbers, calibration, ratio | `docs/RESULTS_FEATURES.md` |
| 7 Alerts | Channel preview, rules, rescue | `docs/ALERTS_FEATURES.md` |
| 8 Agent setup | Terms, switch, preview | `docs/SETUP_FEATURES.md` |
| 9 Reviewer pages | How it works, tour, Under the hood | `docs/REVIEWER_FEATURES.md` |
| 10 Evaluation and learning | Evals page, eval scripts, release gate (`npm run eval:gate`) | `docs/EVAL_FEATURES.md` |
| 11 Platform behaviour | No-key fallback, provider chain, budget, labelling, robots | `docs/PLATFORM_FEATURES.md` |

## Checked at the lock
- 327 unit tests, 26 browser suites (no-key, fake Claude, fake Groq), 12-page sweep at two widths: all pass. Build passes. Lint: 0 errors, 31 hook-dependency warnings left on purpose.
- Production dependency audit: 0 vulnerabilities. No keys in the repo.
- Screenshots of every page and dialog at 1280px and 390px were looked at.

## Known limits (not bugs; see `docs/DEPLOYED.md` section 16)
- The Anthropic path is built but has never run against the real API. Live checks run on Groq models; saved results for C01 to C16 come from prompt v1.
- The release gate on the eval still fails (needs-judgment 75%, first-try citation 83%). Nothing was tuned.
- Rate limits and caches are in memory per server instance.
- The eval holds one injection case (C19).
- Demo actions live in this browser only.

## Still the builder's to do
Device checks (Safari row clicks, iPhone, Firefox, a first-time tester), pin `FX_RATE_INR_PER_USD`, prototype tests with merchants, then the one-pager and 90-second video, and the `submission` tag after a final look. Deadline 13 Oct, 11:59 PM IST.

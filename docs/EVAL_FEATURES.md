# 10. Evaluation and learning machinery

- 40 labelled cases, including held-out C31 to C40 and injection cases, with an answer key.
- `npm run eval`, a GitHub Action, and results saved to `eval/results/`. Incomplete runs are never written as complete.
- **Metrics:** agreement with the key vs a fixed checklist, needs-judgment, first-try citation, Escalate accuracy, and whether injected instructions were resisted.
- **Release gate:** `npm run eval -- --gate` prints PASS or FAIL against the product's own launch bars.
- **Misses into the eval set:** `npm run eval:add`, which masks emails and long numbers before anything is added.
- Unit tests plus the browser test suites.

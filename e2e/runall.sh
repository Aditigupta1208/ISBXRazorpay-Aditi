#!/bin/bash
SP="$(cd "$(dirname "$0")" && pwd)"; OUT=$SP/all.txt; : > $OUT
run(){ for s in "$@"; do r=$(timeout 170 bash $SP/run1.sh $s.py 2>&1 | grep -E "ALL OK|FAIL" | head -3 | tr '\n' ' '); echo "$s: $r" >> $OUT; done; }
echo "== no-key" >> $OUT
fuser -k 3111/tcp 4010/tcp >/dev/null 2>&1; cd "$SP/.."; (env -u ANTHROPIC_API_KEY -u GEMINI_API_KEY -u GROQ_API_KEY FX_API_URL=http://127.0.0.1:4011/ setsid nohup npx next start -p 3111 >/tmp/ns.log 2>&1 < /dev/null &); sleep 7
run e2e_list e2e_entry e2e_polish e2e_rebuttal e2e_a11y e2e_results e2e_review e2e_rules e2e_next e2e_tour e2e_start e2e_checklist e2e_figures e2e_learning e2e_pdf e2e_rescue e2e_b1 e2e_b2 e2e_dd6 e2e_audit_fixes e2e_walkthrough
echo "== live (fake claude)" >> $OUT
bash $SP/live.sh >/dev/null 2>&1; sleep 4
run e2e_m5 e2e_m5b
bash \$SP/live.sh >/dev/null 2>&1; sleep 4
run e2e_evidence_fixes
bash $SP/live.sh >/dev/null 2>&1; sleep 4
run e2e_autorerun e2e_change e2e_addev
echo "== live groq" >> $OUT
bash $SP/live_groq.sh >/dev/null 2>&1; sleep 4
run e2e_assist
echo DONE >> $OUT

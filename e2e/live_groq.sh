#!/bin/bash
fuser -k 3111/tcp 4010/tcp 4013/tcp 4014/tcp >/dev/null 2>&1; sleep 0.5
S="$(cd "$(dirname "$0")" && pwd)"
rm -f $S/fake_requests.jsonl
(python3 $S/fake_groq.py >/tmp/fq.log 2>&1 &)
cd "$S/.."
(env -u ANTHROPIC_API_KEY -u GEMINI_API_KEY GROQ_API_KEY=gsk-test-key GROQ_API_URL=http://127.0.0.1:4014/openai/v1 FX_API_URL=http://127.0.0.1:4011/ npx next start -p 3111 >/tmp/next.log 2>&1 &)
sleep 4

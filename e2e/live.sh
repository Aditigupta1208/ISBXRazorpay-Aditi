#!/bin/bash
# restart the app in live mode (fake Claude) so rate limits start fresh
fuser -k 3111/tcp 4010/tcp >/dev/null 2>&1; sleep 0.5
S="$(cd "$(dirname "$0")" && pwd)"
(python3 $S/fake_anthropic.py >/tmp/fa.log 2>&1 &)
cd "$S/.."
(ANTHROPIC_API_KEY=fake ANTHROPIC_BASE_URL=http://127.0.0.1:4010 FX_API_URL=http://127.0.0.1:4011/ npx next start -p 3111 >/tmp/next.log 2>&1 &)
sleep 4

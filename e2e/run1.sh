#!/bin/bash
# usage: run1.sh suite [args]; prints FAIL lines and the failing source line
cd "$(cd "$(dirname "$0")" && pwd)"
timeout 200 python3 "$@" 2>&1 | grep -E "FAIL|ALL OK|SOME|^    [a-z].*\(|Call log|waiting for|Error:" | cut -c1-230 | head -12

# Browser tests

End-to-end checks written with Playwright (Python). They drive the real app in Chromium at desktop and phone widths, in three modes: no API key, a stand-in Claude server (`fake_anthropic.py`) and a stand-in Groq server (`fake_groq.py`). No real AI provider is called and no key is needed.

`npm run build` first, then `bash e2e/runall.sh` (writes `e2e/all.txt`). `e2e/sweep.py` loads every page at two widths and reports sideways scroll and console errors. The ports (3111, 4010, 4011) are fixed in the scripts. Needs `pip install playwright` and a Chromium install.

These are the checks used before each push. The unit tests (`npm test`) cover the logic; these cover what a person sees.

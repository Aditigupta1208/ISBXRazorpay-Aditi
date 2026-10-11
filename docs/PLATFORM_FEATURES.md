# 11. Platform behaviour

- **Works with no API key.** Every page runs on saved results, labelled "Saved result: <model>, prompt <version>".
- **Provider chain:** Groq qwen first, then gpt-oss-120b, then saved results. The Anthropic path is built but has never run against the real API.
- Forced tool call, zod validation, one retry, then fallback.
- **Budget protection:** rate limit, input caps, an output token cap, and a result cache.
- Secrets stay server-side.
- **Clear labelling:** the "Concept prototype... Not an official Razorpay product" banner, no Razorpay logo, "demo rate" labels, "AI estimate" labels and "Simulated" labels.
- **Quality:** branded 404 and error pages, icon and share image, keyboard focus and 4.5:1 contrast, skip link, 40px tap targets, and no sideways scroll at 390px.

**Not built (deliberate):** live Razorpay API calls, login, a database, real alert sending, fraud disputes, arbitration, refunds, a mobile app.

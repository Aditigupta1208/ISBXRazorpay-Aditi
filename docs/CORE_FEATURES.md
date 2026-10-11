# 1. The core: Fold-or-Fight check

- **Three calls plus a hand-off:** Fight, Fold (accept) or Escalate (get a missing document first), each with a plain-words reason. Fraud codes (10.x) go to Chargeback Shield and no model is called.
- **Covers five non-fraud reasons:** service not provided, cancelled subscription, not as described, refund not processed, cancelled service.
- **Applies Visa's rule** for the reason code to the dispute record and the merchant's evidence.
- **Confidence level** (High, Medium or Low) and a source label on every call, either "Live: <model>, prompt v2.3" or "Saved result: <model>, prompt <version>".
- **Deciding evidence chips** (E1, E3…) that scroll to and highlight the document.
- **Named gap:** the call leads with "Missing: …" or "Decided by: …".
- **Missing and Contradictions lines.**
- **Chance to win:** shown smaller, as a rough AI estimate, and blended with the merchant's own past results (Fight calls only).
- **Customer history:** earlier disputes from the same customer, shown only when Razorpay's record has them.
- **Money maths:** amount at stake in ₹, amount taken back if you lose, possible Visa arbitration fee, and a test of whether fighting pays. It shows a "Check the money" note and never silently changes the call.
- **Live exchange rate** (ECB, cached 12 hours) with a labelled fallback to a demo rate.
- **Clear-win fast lane:** a green banner for High-confidence Fight calls with nothing missing.
- **"The call changed" banner** after a re-run, naming the document that changed it.
- **Checklist vs agent:** a plain checklist runs alongside, and a box says whether it would have given the same advice.

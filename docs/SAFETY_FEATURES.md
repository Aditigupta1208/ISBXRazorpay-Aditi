# 4. Safety checks in code (R1–R9, shown in the UI)

- **R3, R4, R5, R8 change the call:**
  - R3: a contest needs at least one document.
  - R4: the draft must be allowed for the call.
  - R5: an unreadable or conflicting document is flagged.
  - R8: a Fight must cite a key document for its reason code, or it becomes Escalate.
- **R1, R2, R6, R7, R9 stop a bad answer or draft:**
  - R1: every sentence cites a document.
  - R2: citations must point to real documents.
  - R6: hidden instructions in evidence are ignored.
  - R7: full card numbers are rejected, in the evidence and in the response draft. Separators (spaces, dashes, dots, slashes), non-breaking spaces and full-width digits are seen through; a number must start like a card and pass the check digit, so ordinary order numbers are left alone.
  - R9: every figure in the draft must appear in a cited document, or Submit is blocked until it's fixed or ticked.
- **Prompt-injection defence:** each document is wrapped as `<evidence id="E1">` with the closing tag escaped, the model can call only the forced tool, and every action needs a click. Zero-width characters and full-width brackets are stripped or treated as plain ones first, and `system`, `tool_use` and similar tags are escaped as well. Known limit: the eval holds one injection case (C19), so the defence is proven by unit tests and that case, not by a large set.

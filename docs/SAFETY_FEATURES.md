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
  - R7: full card numbers are rejected.
  - R9: every figure in the draft must appear in a cited document, or Submit is blocked until it's fixed or ticked.
- **Prompt-injection defence:** each document is wrapped as `<evidence id="E1">` with the closing tag escaped, the model can call only the forced tool, and every action needs a click.

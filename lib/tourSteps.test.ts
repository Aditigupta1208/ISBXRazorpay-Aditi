import { test } from "node:test";
import assert from "node:assert/strict";
import { TOUR_STEPS } from "./tourSteps";
import { getDemoCases } from "./data";

const PAGES = new Set(["/", "/disputes", "/results", "/evals", "/agent-studio", "/how-it-works"]);

test("merchant stops come first and the last two are for reviewers", () => {
  const flags = TOUR_STEPS.map((s) => s.audience === "reviewers");
  assert.deepEqual(flags, [false, false, false, false, false, false, false, false, false, true, true]);
});

test("every tour stop points at a real page or demo dispute", () => {
  const demo = new Set(getDemoCases().map((c) => `/disputes/${c.id}`));
  for (const s of TOUR_STEPS) assert.ok(PAGES.has(s.href) || demo.has(s.href), s.href);
});

test("steps are numbered in order, short, and free of jargon", () => {
  TOUR_STEPS.forEach((s, i) => {
    assert.ok(s.title.startsWith(`${i + 1}. `), s.title);
    assert.ok(s.text.length <= 260, `step ${i + 1} is ${s.text.length} characters`);
    assert.ok(!/\b(RAG|schema|tool call|prompt|LLM)\b/i.test(s.text), s.text);
  });
});

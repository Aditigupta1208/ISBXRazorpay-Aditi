import test from "node:test";
import assert from "node:assert/strict";
import { byUrgency } from "./list.ts";

test("due within 24h first, then the rest, Shield last; biggest rupees first inside each group", () => {
  const rows = [
    { id: "big-later", hours: 44, inr: 219000, shield: false },
    { id: "shield", hours: 28, inr: 106000, shield: true },
    { id: "small-urgent", hours: 8, inr: 8000, shield: false },
    { id: "big-urgent", hours: 20, inr: 436000, shield: false },
    { id: "mid-later", hours: 30, inr: 106000, shield: false },
    { id: "edge", hours: 24, inr: 1, shield: false },
  ];
  assert.deepEqual(rows.sort(byUrgency).map((r) => r.id), ["big-urgent", "small-urgent", "big-later", "mid-later", "edge", "shield"]);
});

test("a Shield dispute with little time left still goes last", () => {
  const rows = [{ id: "s", hours: 2, inr: 999999, shield: true }, { id: "n", hours: 90, inr: 1, shield: false }];
  assert.deepEqual(rows.sort(byUrgency).map((r) => r.id), ["n", "s"]);
});

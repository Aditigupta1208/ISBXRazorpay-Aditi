import { getDemoCases, getSavedResult } from "./data";
import { byUrgency } from "./list";
import { toInr } from "./format";
import type { Rates } from "./rates";

/** Dispute ids in the same order as the Disputes list, so Previous and Next follow what the merchant sees. */
export function listOrder(rates: Rates): string[] {
  return getDemoCases()
    .map((c) => ({ id: c.id, hours: c.dispute.respond_by_hours_left, inr: toInr(c.dispute.amount / 100, c.dispute.currency, rates), shield: getSavedResult(c.id)?.call === "shield" }))
    .sort(byUrgency)
    .map((x) => x.id);
}

export function neighbours(order: string[], id: string): { prev: string | null; next: string | null } {
  const i = order.indexOf(id);
  if (i < 0) return { prev: null, next: null };
  return { prev: order[i - 1] ?? null, next: order[i + 1] ?? null };
}

/** Default order of the disputes list and of the Previous / Next links: soonest deadline first, Chargeback Shield last, biggest rupees first on a tie. */
export interface Sortable {
  hours: number;
  inr: number;
  shield: boolean;
}

export function urgencyGroup(x: Sortable): 0 | 1 | 2 {
  if (x.shield) return 2; // nothing to decide: covered by Chargeback Shield
  return x.hours < 24 ? 0 : 1;
}

export function byUrgency(a: Sortable, b: Sortable): number {
  return bySort("deadline")(a, b);
}

export type SortKey = "deadline" | "amount";

/**
 * The order the merchant picks in the table: soonest deadline first, or biggest amount first. Chargeback Shield disputes
 * (nothing to decide) always go last, and ties keep the other measure as a second key so the order is stable.
 */
export function bySort(key: SortKey) {
  return (a: Sortable, b: Sortable): number => {
    if (a.shield !== b.shield) return a.shield ? 1 : -1;
    return key === "deadline" ? a.hours - b.hours || b.inr - a.inr : b.inr - a.inr || a.hours - b.hours;
  };
}

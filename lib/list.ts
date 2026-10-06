/** Order of the disputes list: what is due within 24 hours first, then the rest, Chargeback Shield last. Biggest rupees first inside each group. */
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
  return urgencyGroup(a) - urgencyGroup(b) || b.inr - a.inr;
}

/**
 * Customer history, read only from the Razorpay facts line. Nothing is guessed: if the line is silent, we say so.
 * Examples of the line: "first payment from this customer; no earlier disputes", "two earlier annual payments (May 2024, May 2025) with no disputes".
 */
export interface CustomerHistory {
  payments: string; // "First payment from this customer", "2 earlier payments (May 2024, May 2025)" or "Earlier payments: not stated"
  disputes: string; // "No earlier disputes" or "Earlier disputes: not stated"
  known: boolean; // false when the facts say nothing about history at all
}

const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };

export function customerHistory(facts: string): CustomerHistory {
  const f = facts.toLowerCase();
  let payments = "Earlier payments: not stated";
  let paymentsKnown = true;
  const earlier = f.match(/\b(one|two|three|four|five|\d+) earlier (?:annual |monthly )?payments?(?: from the same card)?(?: in (\d{4}))?(?: \(([^)]+)\))?/);
  if (/first payment from this customer|no earlier payments/.test(f)) payments = "First payment from this customer";
  else if (earlier) {
    const n = WORDS[earlier[1]] ?? Number(earlier[1]);
    const when = earlier[3] ? ` (${earlier[3].replace(/\b([a-z])/g, (m) => m.toUpperCase())})` : earlier[2] ? ` (${earlier[2]})` : "";
    payments = `${n} earlier payment${n === 1 ? "" : "s"}${when}`;
  } else {
    const dated = f.match(/earlier annual payment on ([0-9a-z ]+?)(?: with|;|\.|$)/);
    if (dated) payments = `1 earlier payment (${dated[1].replace(/\b([a-z])/g, (m) => m.toUpperCase())})`;
    else paymentsKnown = false;
  }
  const noDispute = /no earlier disputes?|with no disputes?|no earlier payments or disputes/.test(f);
  const disputes = noDispute ? "No earlier disputes" : "Earlier disputes: not stated";
  return { payments, disputes, known: paymentsKnown || noDispute };
}

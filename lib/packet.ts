/** Evidence packet helpers: exhibit numbers and the response with its citations rewritten as exhibit numbers. */
export function exhibitMap(ids: string[]): Map<string, number> {
  return new Map(ids.map((id, i) => [id, i + 1]));
}

/** "[E3]" becomes "[Exhibit 2]", "[E1, E4]" becomes "[Exhibits 1, 3]", "[Razorpay]" becomes "[Razorpay record]". A citation with an id that is not in the packet is left as it is. */
export function responseWithExhibits(draft: string, map: Map<string, number>): string {
  return draft.replace(/\[([^\]]+)\]/g, (whole, inner: string) => {
    const parts = inner.split(",").map((p) => p.trim());
    if (parts.some((p) => p !== "Razorpay" && !map.has(p))) return whole;
    const nums = parts.filter((p) => p !== "Razorpay").map((p) => String(map.get(p)));
    const record = parts.includes("Razorpay") ? ["Razorpay record"] : [];
    if (nums.length === 0) return "[Razorpay record]";
    return `[Exhibit${nums.length > 1 ? "s" : ""} ${[...nums, ...record].join(", ")}]`;
  });
}

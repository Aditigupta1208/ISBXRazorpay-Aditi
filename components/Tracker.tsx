"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track, trackNewVisitor } from "@/lib/track";

/** Counts a first visit and views of the Results, Evals and How it works pages. Anonymous; see lib/usage.ts. */
export function Tracker() {
  const path = usePathname() ?? "";
  useEffect(() => {
    trackNewVisitor();
    if (path === "/results") track("results_viewed");
    else if (path === "/evals") track("evals_viewed");
    else if (path === "/how-it-works") track("how_it_works_viewed");
  }, [path]);
  return null;
}

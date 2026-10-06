"use client";
import type { UsageEvent } from "./usage";

const SEEN = "da:v1:seen";

/** Fire and forget. Skipped when the browser says Do Not Track. Never throws, never shows anything. */
export function track(event: UsageEvent, id?: string) {
  try {
    if (navigator.doNotTrack === "1") return;
    void fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, id }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Count a visitor once per browser. */
export function trackNewVisitor() {
  try {
    if (window.localStorage.getItem(SEEN)) return;
    window.localStorage.setItem(SEEN, "1");
  } catch {
    return; // no storage: skip rather than count every page load
  }
  track("new_visitor");
}

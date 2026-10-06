"use client";
import { useEffect, useState } from "react";
import type { Rec } from "./results";

/** What the merchant did in this demo, kept in this browser only (one small list, not the whole case state). */
const KEY = "da:v1:ledger";

export function readLedger(): Rec[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? (v as Rec[]) : [];
  } catch {
    return [];
  }
}

function write(list: Rec[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: the Results page just shows the sample history */
  }
}

export function upsertLedger(rec: Rec) {
  const list = readLedger().filter((r) => r.id !== rec.id);
  write([...list, rec]);
}

export function removeLedger(id: string) {
  const list = readLedger();
  if (list.some((r) => r.id === id)) write(list.filter((r) => r.id !== id));
}

export function clearLedger() {
  write([]);
}

export function useLedger(): { recs: Rec[]; ready: boolean } {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setRecs(readLedger());
    setReady(true);
  }, []);
  return { recs, ready };
}

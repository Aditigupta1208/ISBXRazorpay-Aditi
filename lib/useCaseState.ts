"use client";
import { useCallback, useEffect, useState } from "react";
import type { Meta } from "./agent";
import type { CheckView } from "./types";

export interface AuditEntry {
  at: string;
  actor: "You" | "Advisor";
  text: string;
}
export interface ActionRecord {
  type: "submit" | "fold";
  at: string;
  request: string;
}
export interface CaseState {
  draft?: string;
  contestAmount?: number; // subunits
  reviewOpen?: boolean;
  action?: ActionRecord;
  outcome?: "won" | "lost";
  thumbs?: "up" | "down";
  added?: { id: string; title: string; content: string }[];
  /** The latest live check; absent while the saved result is showing. */
  check?: { view: CheckView; meta: Meta };
  /** The call shown before the last live re-run, kept so the screen can say what changed. Cleared on dismiss. */
  prevCall?: "fight" | "fold" | "escalate" | "shield";
  /** Evidence changed since the last check. */
  dirty?: boolean;
  audit: AuditEntry[];
}

const key = (id: string) => `da:v1:${id}`;
const empty: CaseState = { audit: [] };

/** Per-dispute demo state, kept in this browser only. Works without storage (private windows, blocked storage). */
export function useCaseState(id: string) {
  const [state, setState] = useState<CaseState>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key(id));
      if (raw) setState({ ...empty, ...JSON.parse(raw) });
    } catch {
      /* storage unavailable: start empty */
    }
    setReady(true);
  }, [id]);

  const update = useCallback(
    (fn: (s: CaseState) => CaseState) => {
      setState((prev) => {
        const next = fn(prev);
        try {
          window.localStorage.setItem(key(id), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [id],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(key(id));
    } catch {
      /* ignore */
    }
    setState(empty);
  }, [id]);

  return { state, update, reset, ready };
}

export function readAction(id: string): ActionRecord | undefined {
  try {
    const raw = window.localStorage.getItem(key(id));
    return raw ? (JSON.parse(raw) as CaseState).action : undefined;
  } catch {
    return undefined;
  }
}

export const now = () => new Date().toISOString();

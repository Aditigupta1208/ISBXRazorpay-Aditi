"use client";
import { useCallback, useEffect, useState } from "react";
import { containsCardNumber } from "./guardrails";
import { ACCEPTANCE_OPTIONS, MAX_POLICY_CHARS, type Acceptance } from "./limits";

/** Agent setup, kept in this browser only (demo). */
export interface Profile {
  enabled: boolean;
  policy: string;
  acceptance: Acceptance;
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
}
export const DEFAULT_PROFILE: Profile = { enabled: true, policy: "", acceptance: "unsure", notifyEmail: true, notifyWhatsapp: false };
const KEY = "da:v1:profile";

/** The terms to send with a check: nothing when they are empty, too long or hold a card number (Agent setup says so). */
export function usablePolicy(p: Profile): { text: string; acceptance: Acceptance } | undefined {
  const text = p.policy.trim();
  if (!text || text.length > MAX_POLICY_CHARS || containsCardNumber(text)) return undefined;
  return { text, acceptance: p.acceptance };
}
export const policyProblem = (p: Profile): boolean => p.policy.trim().length > 0 && !usablePolicy(p);

/** A damaged value in storage falls back to the default for that field. */
export function sanitizeProfile(raw: unknown): Profile {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_PROFILE;
  return {
    enabled: typeof o.enabled === "boolean" ? o.enabled : d.enabled,
    policy: typeof o.policy === "string" ? o.policy.slice(0, MAX_POLICY_CHARS * 3) : d.policy,
    acceptance: ACCEPTANCE_OPTIONS.some((a) => a.value === o.acceptance) ? (o.acceptance as Acceptance) : d.acceptance,
    notifyEmail: typeof o.notifyEmail === "boolean" ? o.notifyEmail : d.notifyEmail,
    notifyWhatsapp: typeof o.notifyWhatsapp === "boolean" ? o.notifyWhatsapp : d.notifyWhatsapp,
  };
}

export function readProfile(): Profile {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitizeProfile(JSON.parse(raw)) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setProfile(readProfile());
    setReady(true);
  }, []);
  const save = useCallback((p: Profile) => {
    setProfile(p);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      /* storage unavailable: setup lasts until the page closes */
    }
  }, []);
  return { profile, save, ready };
}

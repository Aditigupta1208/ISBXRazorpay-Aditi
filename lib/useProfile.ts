"use client";
import { useCallback, useEffect, useState } from "react";
import type { Acceptance } from "./limits";

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

export function readProfile(): Profile {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
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

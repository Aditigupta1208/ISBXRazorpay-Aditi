"use client";
import { createContext, useContext, type ReactNode } from "react";
import { FALLBACK_RATES, type Rates } from "@/lib/rates";

const Ctx = createContext<Rates>(FALLBACK_RATES);
export function RatesProvider({ rates, children }: { rates: Rates; children: ReactNode }) {
  return <Ctx.Provider value={rates}>{children}</Ctx.Provider>;
}
export const useRates = () => useContext(Ctx);

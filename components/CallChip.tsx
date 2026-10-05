import type { Call } from "@/lib/types";

const META: Record<Call, { label: string; icon: string; cls: string }> = {
  fight: { label: "Fight", icon: "✓", cls: "bg-fight-soft text-fight" },
  fold: { label: "Fold", icon: "↩", cls: "bg-fold-soft text-fold" },
  escalate: { label: "Escalate", icon: "⚠", cls: "bg-escalate-soft text-escalate" },
  shield: { label: "Chargeback Shield", icon: "🛡", cls: "bg-shield-soft text-shield" },
};

export function CallChip({ call, size = "sm" }: { call: Call; size?: "sm" | "lg" }) {
  const m = META[call];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${m.cls} ${
        size === "lg" ? "px-3.5 py-1.5 text-[15px]" : "px-2.5 py-0.5 text-[13px]"
      }`}
    >
      <span aria-hidden>{m.icon}</span>
      {m.label}
    </span>
  );
}

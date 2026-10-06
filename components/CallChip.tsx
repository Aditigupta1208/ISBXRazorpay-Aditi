import type { Call } from "@/lib/types";

const META: Record<Call, { label: string; icon: string; cls: string }> = {
  fight: { label: "Fight", icon: "✓", cls: "bg-fight-soft text-fight" },
  fold: { label: "Fold", icon: "↩", cls: "bg-fold-soft text-fold" },
  escalate: { label: "Escalate", icon: "⚠", cls: "bg-escalate-soft text-escalate" },
  shield: { label: "Chargeback Shield", icon: "🛡", cls: "bg-shield-soft text-shield" },
};

/** short: on phones the Chargeback Shield chip reads "Shield", so tables of chips fit a narrow screen. */
export function CallChip({ call, size = "sm", short = false }: { call: Call; size?: "sm" | "lg"; short?: boolean }) {
  const m = META[call];
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${m.cls} ${
        size === "lg"
          ? "gap-1.5 px-3.5 py-1.5 text-[15px]"
          : short
            ? "gap-1 px-1.5 py-0.5 text-xs md:gap-1.5 md:px-2.5 md:text-[13px]"
            : "gap-1.5 px-2.5 py-0.5 text-[13px]"
      }`}
    >
      <span aria-hidden>{m.icon}</span>
      {short && call === "shield" ? (
        <>
          <span className="md:hidden">Shield</span>
          <span className="hidden md:inline">{m.label}</span>
        </>
      ) : (
        m.label
      )}
    </span>
  );
}

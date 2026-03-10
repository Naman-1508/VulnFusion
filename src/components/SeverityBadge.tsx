"use client";

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  Critical: { color: "#ef4444", bg: "rgba(239,68,68,0.15)",    border: "rgba(239,68,68,0.4)"    },
  High:     { color: "#f97316", bg: "rgba(249,115,22,0.15)",   border: "rgba(249,115,22,0.4)"   },
  Medium:   { color: "#eab308", bg: "rgba(234,179,8,0.15)",    border: "rgba(234,179,8,0.4)"    },
  Low:      { color: "#3b82f6", bg: "rgba(59,130,246,0.15)",   border: "rgba(59,130,246,0.4)"   },
  Info:     { color: "#64748b", bg: "rgba(100,116,139,0.12)",  border: "rgba(100,116,139,0.3)"  },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.Info;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-widest"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {severity}
    </span>
  );
}

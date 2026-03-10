"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High:     "#f97316",
  Medium:   "#eab308",
  Low:      "#3b82f6",
  Info:     "#64748b",
};

const CUSTOM_LABEL = ({
  cx, cy, midAngle, outerRadius, name, value, percent
}: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = outerRadius + 20;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill={COLORS[name] ?? "#64748b"} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 600 }}>
      {name} ({value})
    </text>
  );
};

interface SeverityChartProps {
  vulnerabilities: Array<{ severity: string }>;
}

export function SeverityChart({ vulnerabilities }: SeverityChartProps) {
  const counts: Record<string, number> = {};
  for (const v of vulnerabilities) {
    counts[v.severity] = (counts[v.severity] ?? 0) + 1;
  }
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-[#3d4f63] text-sm font-mono">
        No vulnerability data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
          paddingAngle={3} dataKey="value" labelLine={false} label={CUSTOM_LABEL}>
          {data.map(entry => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#64748b"}
              style={{ outline: "none", filter: `drop-shadow(0 0 6px ${COLORS[entry.name] ?? "#64748b"}55)` }} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", fontFamily: "monospace", fontSize: "12px", color: "#e2e8f0" }}
          itemStyle={{ color: "#e2e8f0" }}
          cursor={false}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

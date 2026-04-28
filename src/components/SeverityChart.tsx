"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useState } from "react";

const COLORS: Record<string, string> = {
  Critical: "#f43f5e",
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
  const r = outerRadius + 25;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill={COLORS[name] ?? "#64748b"} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-[10px] font-black uppercase tracking-widest drop-shadow-md">
      {name} {value}
    </text>
  );
};

interface SeverityChartProps {
  vulnerabilities: Array<{ severity: string }>;
}

export function SeverityChart({ vulnerabilities }: SeverityChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const v of vulnerabilities) {
    counts[v.severity] = (counts[v.severity] ?? 0) + 1;
    total++;
  }
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-3">
           <div className="w-4 h-4 rounded-full bg-cyan-500/50 animate-ping"></div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Awaiting Telemetry</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <defs>
          {data.map((entry) => (
             <filter id={`glow-${entry.name}`} key={entry.name}>
               <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
               <feMerge>
                 <feMergeNode in="coloredBlur"/>
                 <feMergeNode in="SourceGraphic"/>
               </feMerge>
             </filter>
          ))}
        </defs>
        
        {/* Center Text */}
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="text-4xl font-black fill-white" style={{ fontFamily: 'Inter' }}>
           {total}
        </text>
        <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-black uppercase tracking-[0.2em] fill-slate-500">
           Findings
        </text>

        <Pie 
          data={data} 
          cx="50%" cy="50%" 
          innerRadius={80} 
          outerRadius={110}
          paddingAngle={4} 
          dataKey="value" 
          labelLine={false} 
          label={CUSTOM_LABEL}
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
          animationDuration={1500}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell 
              key={entry.name} 
              fill={COLORS[entry.name] ?? "#64748b"}
              style={{ 
                outline: "none", 
                filter: activeIndex === index ? `url(#glow-${entry.name})` : 'none',
                transform: activeIndex === index ? 'scale(1.03)' : 'scale(1)',
                transformOrigin: 'center',
                transition: 'all 0.3s ease'
              }} 
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ 
            background: "rgba(10, 15, 29, 0.9)", 
            border: "1px solid rgba(255,255,255,0.1)", 
            borderRadius: "16px", 
            fontFamily: "Inter", 
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontSize: "10px",
            color: "#e2e8f0",
            backdropFilter: "blur(12px)"
          }}
          itemStyle={{ color: "#fff", fontWeight: "900" }}
          cursor={false}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

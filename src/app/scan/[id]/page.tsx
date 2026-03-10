"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowLeft, Download, Copy, Search, ExternalLink, ShieldAlert, Cpu, Database, Activity, LayoutGrid, CheckCircle2, Box, Globe, Server, TerminalSquare, AlertTriangle, Loader2, XCircle } from "lucide-react";

interface Sub  { id: string; domain: string; }
interface Vuln { id: string; name: string; severity: string; tool: string; description: string; proof?: string; }
interface ScanData { id: string; targetUrl: string; status: string; createdAt: string; subdomains: Sub[]; vulnerabilities: Vuln[]; }

const SEV_ORDER = ["Critical", "High", "Medium", "Low", "Info"];
const SEV_COLOR: Record<string, string> = { 
  Critical: "rose", 
  High: "orange", 
  Medium: "amber", 
  Low: "blue", 
  Info: "slate" 
};

export default function ScanResult() {
  const { id } = useParams() as { id: string };
  const [scan, setScan]   = useState<ScanData|null>(null);
  const [loading, setL]   = useState(true);
  const [error, setErr]   = useState("");
  const [search, setSrch] = useState("");
  const [tab, setTab]     = useState<"vulns" | "subs">("vulns");
  const [copied, setCopy] = useState(false);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const r = await fetch(`/api/scans/${id}`);
        if (!r.ok) { setErr("Target signature not found in central database"); return; }
        setScan(await r.json());
      } catch { setErr("Failed to synchronize with backend"); }
      setL(false);
    };
    fetchScan();
    const iv = setInterval(() => {
      setScan(p => { if (p?.status === "RUNNING" || p?.status === "PENDING") fetchScan(); return p; });
    }, 4000);
    return () => clearInterval(iv);
  }, [id]);

  const doCopy = () => { if (!scan) return; navigator.clipboard.writeText(JSON.stringify(scan, null, 2)); setCopy(true); setTimeout(() => setCopy(false), 2000); };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <div className="bg-orb-1 opacity-40 mx-auto" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative h-24 w-24">
           <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="rgba(14,165,233,0.2)" strokeWidth="1" strokeDasharray="10 5"/><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="2" strokeDasharray="20 40"/></svg>
           <div className="absolute inset-0 flex items-center justify-center"><Shield className="h-8 w-8 text-cyan-500 animate-pulse" /></div>
        </div>
        <div className="font-mono text-sm uppercase tracking-widest text-cyan-400">Establishing Secure Uplink...</div>
      </div>
    </div>
  );

  if (error || !scan) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <div className="bg-orb-1 opacity-20 mx-auto" /><div className="bg-orb-2 opacity-20 mx-auto" />
      <div className="relative z-10 glass-panel rounded-3xl p-12 text-center max-w-lg shadow-[0_0_100px_-20px_rgba(225,29,72,0.3)]">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10">
          <AlertTriangle className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Access Denied / Not Found</h2>
        <p className="text-slate-400 mb-8 font-light">{error}</p>
        <Link href="/dashboard" className="px-8 py-4 rounded-xl font-bold bg-white text-slate-900 transition-all hover:bg-slate-200 uppercase tracking-widest text-xs">Return to Node</Link>
      </div>
    </div>
  );

  const sevCount: Record<string, number> = {};
  scan.vulnerabilities.forEach(v => { sevCount[v.severity] = (sevCount[v.severity] ?? 0) + 1; });
  const sorted = [...scan.vulnerabilities].sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity));
  const filtered = sorted.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.tool.toLowerCase().includes(search.toLowerCase()) ||
    v.severity.toLowerCase().includes(search.toLowerCase())
  );

  // Custom SVG Donut Calculation
  const totalVulns = scan.vulnerabilities.length || 1; // prevent /0
  let currentOffset = 0;
  const radius = 40, circumference = 2 * Math.PI * radius;
  
  const colorsStr: Record<string, string> = { Critical: "#f43f5e", High: "#f97316", Medium: "#f59e0b", Low: "#3b82f6", Info: "#64748b" };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative overflow-hidden">
      <div className="bg-orb-1 opacity-40 fixed top-0" />
      <div className="bg-orb-2 opacity-30 fixed bottom-0 right-0" />
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-2xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6 lg:px-12">
          <Link href="/dashboard" className="flex items-center gap-3 text-slate-400 hover:text-cyan-400 transition-colors group">
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all"><ArrowLeft className="h-4 w-4" /></div>
            <span className="text-sm font-semibold uppercase tracking-widest hidden sm:block">Back to Dashboard</span>
          </Link>
          <div className="flex bg-slate-900/50 rounded-lg p-1 border border-white/5">
            <button onClick={doCopy} className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white">
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />} {copied ? "COPIED" : "JSON RAW"}
            </button>
            <button className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold bg-white text-slate-900 transition-all hover:bg-slate-200 ml-1">
              <Download className="h-4 w-4" /> PDF REPORT
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 lg:px-12 pt-10 relative z-10">
        
        {/* Intelligence Grid Top row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          
          {/* Main Info Card */}
          <div className="xl:col-span-2 glass-card rounded-3xl p-8 relative overflow-hidden group border-white/5 hover:border-cyan-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mt-16 -mr-16 pointer-events-none transition-all group-hover:bg-cyan-500/10" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">{scan.targetUrl}</h1>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 border text-sm font-bold uppercase tracking-widest ${
                      scan.status === "RUNNING" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)]" :
                      scan.status === "FAILED" ? "bg-rose-500/10 text-rose-500 border-rose-500/30" :
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
                    }`}>
                      {scan.status === "RUNNING" ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                       scan.status === "FAILED" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                       {scan.status}
                    </div>
                    <span className="text-slate-500 font-mono text-xs bg-slate-900/80 px-3 py-1.5 rounded-md border border-white/10">{scan.id}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-8 pt-6 border-t border-white/5">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Time Created</div>
                  <div className="text-sm text-slate-300 font-mono">{new Date(scan.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Engine Vers</div>
                  <div className="text-sm text-slate-300 font-mono">v2.0-core</div>
                </div>
              </div>
            </div>
          </div>

          {/* Donut Chart Severities */}
          <div className="xl:col-span-1 glass-panel rounded-3xl border-white/5 p-8 flex flex-col items-center justify-center relative overflow-hidden">
             <h3 className="w-full text-left text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 relative z-10">Threat Distribution</h3>
             <div className="relative w-48 h-48 flex-shrink-0 z-10">
               <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                 {/* Background track */}
                 <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                 {scan.vulnerabilities.length > 0 ? SEV_ORDER.map((sev) => {
                   const count = sevCount[sev] || 0;
                   if (count === 0) return null;
                   const strokeDasharray = `${(count / totalVulns) * circumference} ${circumference}`;
                   const offset = currentOffset;
                   currentOffset += (count / totalVulns) * circumference;
                   return (
                     <circle key={sev} cx="50" cy="50" r={radius} fill="none" stroke={colorsStr[sev]} strokeWidth="12"
                       strokeDasharray={strokeDasharray} strokeDashoffset={-offset} className="transition-all duration-1000 ease-out" />
                   )
                 }) : (
                   <circle cx="50" cy="50" r={radius} fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray={`${circumference} ${circumference}`} />
                 )}
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-bold text-white tracking-tighter">{scan.vulnerabilities.length}</span>
                 <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Total</span>
               </div>
             </div>
             <div className="w-full mt-6 flex justify-between gap-1 relative z-10">
               {SEV_ORDER.map(s => {
                  const c = sevCount[s] || 0;
                  return (
                    <div key={s} className={`flex-1 flex flex-col items-center py-2 rounded-lg border ${c > 0 ? `border-${SEV_COLOR[s]}-500/30 bg-${SEV_COLOR[s]}-500/10` : 'border-white/5 bg-white/5'}`}>
                      <span className={`text-lg font-bold ${c > 0 ? `text-${SEV_COLOR[s]}-400` : 'text-slate-600'}`}>{c}</span>
                    </div>
                  )
               })}
             </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Navigation Sidebar */}
          <div className="col-span-1 flex flex-col gap-2">
            <button onClick={() => setTab("vulns")} className={`w-full text-left px-5 py-4 rounded-2xl flex items-center justify-between transition-all border ${tab === "vulns" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[inset_4px_0_0_0_rgba(6,182,212,1)]" : "bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
              <div className="flex items-center gap-3 font-semibold uppercase tracking-wider text-sm"><ShieldAlert className="h-5 w-5"/> Vulnerabilities</div>
              <span className="bg-background/80 px-2 py-0.5 rounded text-xs border border-white/10 font-mono">{scan.vulnerabilities.length}</span>
            </button>
            <button onClick={() => setTab("subs")} className={`w-full text-left px-5 py-4 rounded-2xl flex items-center justify-between transition-all border ${tab === "subs" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[inset_4px_0_0_0_rgba(6,182,212,1)]" : "bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
              <div className="flex items-center gap-3 font-semibold uppercase tracking-wider text-sm"><LayoutGrid className="h-5 w-5"/> Discovered Nodes</div>
              <span className="bg-background/80 px-2 py-0.5 rounded text-xs border border-white/10 font-mono">{scan.subdomains.length}</span>
            </button>
          </div>

          {/* Main List Area */}
          <div className="col-span-1 lg:col-span-3">
            {tab === "vulns" && (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input value={search} onChange={e => setSrch(e.target.value)} placeholder="Query vulnerability database..." className="w-full h-14 rounded-2xl border border-white/10 bg-slate-900/40 pl-12 pr-6 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:bg-slate-900/80 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono shadow-inner" />
                </div>

                <div className="flex flex-col gap-4">
                  <AnimatePresence>
                    {filtered.length === 0 ? (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="rounded-3xl border border-white/5 bg-slate-900/20 py-32 text-center flex flex-col items-center">
                        <TerminalSquare className="h-12 w-12 text-slate-700 mb-4" />
                        <p className="text-slate-400 font-mono">No intelligence data matches the current query parameters.</p>
                      </motion.div>
                    ) : (
                      filtered.map(v => {
                        const sColMap: Record<string, { bg: string, border: string, text: string, shadow: string, bar: string }> = {
                          "Critical":  { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400", shadow: "shadow-rose-500/50", bar: "bg-rose-500" },
                          "High":      { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", shadow: "shadow-orange-500/50", bar: "bg-orange-500" },
                          "Medium":    { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", shadow: "shadow-amber-500/50", bar: "bg-amber-500" },
                          "Low":       { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", shadow: "shadow-blue-500/50", bar: "bg-blue-500" },
                          "Info":      { bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-400", shadow: "shadow-slate-500/50", bar: "bg-slate-500" }
                        };
                        const cls = sColMap[v.severity] || sColMap["Info"];
                        return (
                          <motion.div key={v.id} initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className={`group relative rounded-3xl border ${cls.border} bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm transition-all hover:bg-slate-900/80 overflow-hidden`}>
                            {/* Status glow side panel */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${cls.bar} group-hover:shadow-[0_0_20px_2px] group-hover:${cls.shadow} transition-shadow`} />
                            
                            <div className="flex flex-col sm:flex-row gap-6">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-3">
                                  <span className={`inline-flex items-center justify-center rounded border ${cls.border} ${cls.bg} px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${cls.text}`}>
                                    {v.severity}
                                  </span>
                                  <span className="inline-flex items-center rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 border border-white/10">
                                    Engine: {v.tool}
                                  </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4 leading-snug">{v.name}</h3>
                                <p className="text-base text-slate-400 leading-relaxed max-w-4xl font-light">{v.description}</p>
                                
                                {v.proof && (
                                  <div className="mt-6 rounded-xl border border-white/5 bg-[#0a0f1d] p-0 overflow-hidden shadow-inner flex flex-col">
                                    <div className="bg-slate-900/80 px-4 py-2 border-b border-white/5 flex items-center gap-2">
                                      <TerminalSquare className="h-3 w-3 text-emerald-500" />
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execution Evidence Trace</span>
                                    </div>
                                    <div className="px-4 py-4 overflow-x-auto">
                                      <code className="text-[13px] text-emerald-400 font-mono whitespace-pre">{v.proof}</code>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {tab === "subs" && (
              <div className="glass-panel rounded-3xl p-6 border-white/5 shadow-2xl">
                {scan.subdomains.length === 0 ? (
                  <div className="py-32 text-center flex flex-col items-center">
                    <Globe className="h-12 w-12 text-slate-700 mb-4" />
                    <p className="text-slate-400 font-mono text-sm">No remote nodes identified connected to root domain.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scan.subdomains.map((s, i) => (
                      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay: i*0.02}} key={s.id} className="group flex items-center gap-4 bg-slate-900/60 border border-white/5 p-4 rounded-xl transition-all hover:bg-slate-800 hover:border-cyan-500/30">
                        <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                          <LayoutGrid className="h-4 w-4 text-cyan-500" />
                        </div>
                        <span className="font-mono text-sm text-slate-300 truncate group-hover:text-cyan-400 transition-colors">{s.domain}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

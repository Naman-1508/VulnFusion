"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Play, Loader2, CheckCircle2, XCircle, Clock, Activity, Target, Zap, Search, Bell, Settings, LayoutGrid } from "lucide-react";

interface Scan { id: string; targetUrl: string; status: string; createdAt: string; }

export default function Dashboard() {
  const router = useRouter();
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);
  const [scans, setScans]     = useState<Scan[]>([]);
  const [error, setError]     = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const fetchScans = useCallback(async () => {
    try { const r = await fetch("/api/scans"); if (r.ok) setScans(await r.json()); }
    catch {}
  }, []);

  useEffect(() => {
    fetchScans();
    const iv = setInterval(fetchScans, 4000);
    return () => clearInterval(iv);
  }, [fetchScans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(""); setLoading(true);
    try {
      const r = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUrl: url }) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Failed to initiate execution sequence"); setLoading(false); return; }
      setUrl("");
      if (d.scanId) router.push(`/scan/${d.scanId}`);
    } catch { setError("Neural net synchronization failed."); }
    setLoading(false);
  };

  if (!mounted) return null;

  const stats = {
    total: scans.length,
    active: scans.filter(s => s.status === 'RUNNING' || s.status === 'PENDING').length,
    completed: scans.filter(s => s.status === 'COMPLETED').length,
  };

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      <div className="bg-orb-1 opacity-50" />
      <div className="bg-orb-2 opacity-50" />

      {/* Advanced Sidebar */}
      <aside className="fixed inset-y-0 w-20 flex-col items-center border-r border-white/5 bg-slate-900/40 backdrop-blur-2xl z-50 hidden md:flex py-8">
        <Link href="/" className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-8 transition-transform hover:scale-105">
           <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
           <Shield className="h-6 w-6 text-white" />
        </Link>
        <nav className="flex flex-col gap-4">
           {[
             {i:LayoutGrid, id:"dashboard", tooltip: "Overview"}, 
           ].map((Item) => (
             <button key={Item.id} title={Item.tooltip} className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]`}>
               <Item.i className="h-5 w-5" />
             </button>
           ))}
        </nav>
      </aside>

      <main className="flex-1 md:pl-20 flex flex-col min-h-screen relative z-10">
        
        {/* Top Navbar */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <h1 className="text-xl font-semibold text-white tracking-tight">Command Center</h1>
             <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
               <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span>
               <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">System Optimal</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input placeholder="Query intelligence base..." className="h-10 w-64 rounded-full border border-white/10 bg-slate-900/50 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all" />
            </div>
            <button className="relative h-10 w-10 flex items-center justify-center rounded-full border border-white/10 bg-slate-900/50 text-slate-400 hover:text-white transition-colors">
              <Bell className="h-4 w-4" />
              <div className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-500 to-cyan-500 p-0.5 cursor-pointer">
              <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-bold text-white tracking-tighter">VF</div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-6xl w-full mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
            
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-1 md:col-span-2 glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"><Target className="w-48 h-48"/></div>
                 <div className="relative z-10 w-full mb-4">
                   <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Target Acquisition</h2>
                   <p className="text-2xl font-bold text-white">Initiate Assessment</p>
                 </div>
                 <form onSubmit={handleSubmit} className="relative z-10 flex w-full flex-col sm:flex-row gap-3">
                   <input autoFocus value={url} onChange={e => setUrl(e.target.value)} disabled={loading} placeholder="https://target-domain.com" className="flex-1 h-12 rounded-xl border border-white/10 bg-slate-950/80 px-4 text-sm text-white font-mono placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner" />
                   <button type="submit" disabled={loading || !url.trim()} className="h-12 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
                     {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Zap className="h-4 w-4" />}
                     {loading ? "Aligning..." : "Execute"}
                   </button>
                 </form>
                 {error && <p className="mt-2 text-xs text-rose-500 font-mono relative z-10">ERR: {error}</p>}
              </div>

              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                <div className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Active Sweeps</div>
                <div className="text-5xl font-light text-white font-mono">{stats.active}</div>
              </div>
              
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                <div className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Logs Processed</div>
                <div className="text-5xl font-light text-cyan-400 font-mono">{stats.total}</div>
              </div>
            </div>

            {/* Activity Feed / List */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Clock className="h-5 w-5 text-cyan-500" /> Assessment History</h3>
              </div>
              
              <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border-white/5">
                {scans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="h-16 w-16 mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-white/5"><Activity className="h-8 w-8 text-slate-600" /></div>
                    <p className="text-slate-400 text-lg">Awaiting Target Parameters.</p>
                    <p className="text-sm text-slate-600 mt-1">Provide a URL above to initiate the data stream.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 mx-2 my-2">
                    <AnimatePresence>
                    {scans.map((scan, i) => (
                      <motion.div key={scan.id} initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} transition={{delay: i * 0.05}}>
                        <Link href={`/scan/${scan.id}`} className="group relative flex items-center justify-between p-4 sm:p-5 rounded-xl transition-all hover:bg-slate-800/40">
                          <div className="flex items-center gap-5">
                            {/* Animated Status Icon */}
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-white/5 shadow-inner">
                              {scan.status === "RUNNING" ? (
                                <div className="relative">
                                   <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                                   <div className="absolute inset-0 bg-cyan-400/20 blur-md animate-pulse" />
                                </div>
                              ) : scan.status === "FAILED" ? (
                                <XCircle className="h-5 w-5 text-rose-500" />
                              ) : (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                              <span className="font-mono text-base font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors uppercase tracking-wide">{scan.targetUrl}</span>
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                                <span><span className="text-slate-600">ID:</span> {scan.id.slice(0,12)}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-700"/>
                                <span>{new Date(scan.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="hidden sm:block">
                            <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
                              scan.status === "RUNNING" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_-3px_rgba(34,211,238,0.2)]" :
                              scan.status === "FAILED" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                              "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]"
                            }`}>
                              {scan.status}
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

          </div>
      </main>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Play, Loader2, CheckCircle2, XCircle, Clock, Activity, Target, Zap, Search, Bell, LayoutGrid } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Scan { id: string; url: string; status: string; created_at: string; }

export default function Dashboard() {
  const router = useRouter();
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);
  const [scans, setScans]     = useState<Scan[]>([]);
  const [error, setError]     = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initial fetch
    const fetchScans = async () => {
      const { data } = await supabase.from('scans').select('*').order('created_at', { ascending: false });
      if (data) setScans(data);
    };
    fetchScans();

    // Realtime subscription for list updates
    const sub = supabase.channel('scans-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scans' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setScans(prev => [payload.new as Scan, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setScans(prev => prev.map(s => s.id === payload.new.id ? payload.new as Scan : s));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(""); setLoading(true);
    try {
      const r = await fetch("/api/scan", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ url: url }) 
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Failed to initiate execution sequence"); setLoading(false); return; }
      setUrl("");
      if (d.id) router.push(`/scan/${d.id}`);
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
    <div className="flex min-h-screen bg-background relative overflow-hidden font-sans">
      <div className="bg-orb-1 opacity-40 fixed inset-0 pointer-events-none" />
      <div className="bg-orb-2 opacity-30 fixed inset-0 pointer-events-none" />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 w-20 flex flex-col items-center border-r border-white/5 bg-slate-900/40 backdrop-blur-2xl z-50 hidden md:flex py-8">
        <Link href="/" className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-8 transition-transform hover:scale-105">
           <Shield className="h-6 w-6 text-white" />
        </Link>
        <nav className="flex flex-col gap-4">
           <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
             <LayoutGrid className="h-5 w-5" />
           </button>
        </nav>
      </aside>

      <main className="flex-1 md:pl-20 flex flex-col min-h-screen relative z-10">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <h1 className="text-xl font-bold text-white tracking-tight uppercase">Command Center</h1>
             <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
               <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span>
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Core Optimal</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-500 to-cyan-500 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-black text-white">VF</div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-6xl w-full mx-auto space-y-12">
            
            {/* Action Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2 glass-card rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group border-white/5 hover:border-cyan-500/30 transition-colors">
                 <div className="absolute -right-8 -top-8 opacity-5 group-hover:scale-110 transition-transform pointer-events-none"><Target className="w-64 h-64 text-cyan-500"/></div>
                 <div className="relative z-10 w-full mb-6">
                    <h2 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Neural Acquisition</h2>
                    <p className="text-3xl font-black text-white tracking-tighter">Initiate Assessment</p>
                 </div>
                 <form onSubmit={handleSubmit} className="relative z-10 flex w-full flex-col sm:flex-row gap-3">
                    <input autoFocus value={url} onChange={e => setUrl(e.target.value)} disabled={loading} placeholder="https://target-node.com" className="flex-1 h-14 rounded-2xl border border-white/10 bg-slate-950/80 px-6 text-sm text-white font-mono focus:border-cyan-500/50 focus:outline-none transition-all shadow-2xl" />
                    <button type="submit" disabled={loading || !url.trim()} className="h-14 px-8 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                      {loading ? "Aligning..." : "Execute"}
                    </button>
                 </form>
                 {error && <p className="mt-4 text-[10px] text-rose-500 font-mono tracking-wider">ERR: {error}</p>}
              </div>

              <div className="glass-panel rounded-3xl p-8 flex flex-col justify-center items-center text-center border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Active Sweeps</div>
                <div className="text-6xl font-black text-white tracking-tighter">{stats.active}</div>
              </div>
              
              <div className="glass-panel rounded-3xl p-8 flex flex-col justify-center items-center text-center border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Threat Intel</div>
                <div className="text-6xl font-black text-cyan-400 tracking-tighter">{stats.total}</div>
              </div>
            </div>

            {/* History */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><Clock className="h-4 w-4 text-cyan-500" /> Historical Data Stream</h3>
              
              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence>
                {scans.length === 0 ? (
                  <div className="py-24 text-center border border-dashed border-white/5 rounded-3xl">
                    <p className="text-slate-600 font-mono text-sm uppercase tracking-widest">Awaiting Initial Parameters</p>
                  </div>
                ) : (
                  scans.map((scan, i) => (
                    <motion.div key={scan.id} initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} transition={{delay: i * 0.05}}>
                      <Link href={`/scan/${scan.id}`} className="group flex items-center justify-between p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-sm transition-all hover:bg-slate-800/80 hover:border-cyan-500/20">
                        <div className="flex items-center gap-6">
                          <div className="h-14 w-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                            {scan.status === "RUNNING" ? <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" /> : scan.status === "FAILED" ? <XCircle className="h-5 w-5 text-rose-500" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-lg font-black text-white tracking-tight group-hover:text-cyan-400 transition-colors uppercase">{scan.url}</span>
                            <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                              <span>ID: {scan.id.slice(0,12)}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-800"/>
                              <span>{new Date(scan.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border ${scan.status === 'RUNNING' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : scan.status === 'FAILED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          {scan.status}
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
                </AnimatePresence>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}

"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, ArrowLeft, Download, Copy, Search, ShieldAlert, 
  TerminalSquare, AlertTriangle, Loader2, XCircle, 
  CheckCircle2, LayoutGrid, Activity, Info, Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ScanLog { id: string; message: string; created_at: string; }
interface Finding { id: string; tool: string; severity: string; data: any; created_at: string; }
interface Scan { id: string; url: string; status: string; error?: string; created_at: string; }

const SEV_COLOR: Record<string, string> = { 
  Critical: "rose", High: "orange", Medium: "amber", Low: "blue", Info: "slate" 
};

export default function ScanResult() {
  const { id } = useParams() as { id: string };
  const [scan, setScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [tab, setTab] = useState<"vulns" | "logs">("vulns");
  const [search, setSearch] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Initial Fetch
    const init = async () => {
      const { data: s } = await supabase.from('scans').select('*').eq('id', id).single();
      const { data: f } = await supabase.from('findings').select('*').eq('scan_id', id);
      const { data: l } = await supabase.from('scan_logs').select('*').eq('scan_id', id).order('created_at', { ascending: true });
      
      if (s) setScan(s);
      if (f) setFindings(f);
      if (l) setLogs(l);
    };
    init();

    // 2. Realtime Subscriptions
    const scanSub = supabase.channel(`scan-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scans', filter: `id=eq.${id}` }, 
        (payload) => setScan(payload.new as Scan))
      .subscribe();

    const logsSub = supabase.channel(`logs-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_logs', filter: `scan_id=eq.${id}` }, 
        (payload) => setLogs(prev => [...prev, payload.new as ScanLog]))
      .subscribe();

    const findingsSub = supabase.channel(`findings-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'findings', filter: `scan_id=eq.${id}` }, 
        (payload) => setFindings(prev => [...prev, payload.new as Finding]))
      .subscribe();

    return () => {
      supabase.removeChannel(scanSub);
      supabase.removeChannel(logsSub);
      supabase.removeChannel(findingsSub);
    };
  }, [id]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (!scan) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
    </div>
  );

  const groupedFindings = findings.reduce((acc, f) => {
    if (!acc[f.tool]) acc[f.tool] = [];
    acc[f.tool].push(f);
    return acc;
  }, {} as Record<string, Finding[]>);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative overflow-hidden font-sans">
      <div className="bg-orb-1 opacity-20 fixed top-0 left-0 w-full h-full pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Back to Hub</span>
          </Link>
          <div className="flex items-center gap-4">
             <div className={`h-2 w-2 rounded-full ${scan.status === 'RUNNING' ? 'bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]' : scan.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{scan.status}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="text-5xl font-black text-white tracking-tighter mb-4 truncate">{scan.url}</h1>
            <div className="flex items-center gap-6 text-slate-500 font-mono text-xs">
              <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-500" /> ID: {scan.id.slice(0,8)}...</span>
              <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> CREATED: {new Date(scan.created_at).toLocaleString()}</span>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-12 relative h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: scan.status === 'COMPLETED' ? '100%' : '60%' }} 
              className={`h-full ${scan.status === 'FAILED' ? 'bg-rose-500' : 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]'}`}
              transition={{ duration: 1 }}
            />
            {scan.status === 'RUNNING' && (
              <motion.div 
                animate={{ x: ['-100%', '200%'] }} 
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute top-0 left-0 h-full w-1/3 bg-white/20 blur-sm"
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Sidebar Tabs */}
            <div className="col-span-1 flex flex-col gap-3">
              <button onClick={() => setTab("vulns")} className={`flex items-center justify-between p-5 rounded-2xl transition-all border ${tab === 'vulns' ? 'bg-white/5 border-cyan-500/50 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <div className="flex items-center gap-3 font-bold uppercase tracking-widest text-xs"><ShieldAlert className="h-5 w-5" /> Findings</div>
                <span className="text-xs font-mono">{findings.length}</span>
              </button>
              <button onClick={() => setTab("logs")} className={`flex items-center justify-between p-5 rounded-2xl transition-all border ${tab === 'logs' ? 'bg-white/5 border-cyan-500/50 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <div className="flex items-center gap-3 font-bold uppercase tracking-widest text-xs"><TerminalSquare className="h-5 w-5" /> Engine Trace</div>
              </button>
            </div>

            {/* Content Area */}
            <div className="col-span-1 lg:col-span-3">
              <AnimatePresence mode="wait">
                {tab === 'vulns' ? (
                  <motion.div key="vulns" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                    {findings.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl">
                        <Loader2 className="h-8 w-8 text-slate-700 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Listening for vulnerabilities...</p>
                      </div>
                    ) : (
                      Object.entries(groupedFindings).map(([tool, items]) => (
                        <div key={tool} className="space-y-4">
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3">
                            <Box className="h-4 w-4" /> {tool} ENGINES
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                            {items.map((f, i) => (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={f.id} 
                                className={`group p-6 rounded-2xl border bg-slate-900/50 border-white/5 hover:border-${SEV_COLOR[f.severity]}-500/30 transition-all cursor-pointer relative overflow-hidden`}
                              >
                                <div className={`absolute top-0 left-0 w-1 h-full bg-${SEV_COLOR[f.severity]}-500/50 opacity-0 group-hover:opacity-100 transition-opacity`} />
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-${SEV_COLOR[f.severity]}-500/30 text-${SEV_COLOR[f.severity]}-400 bg-${SEV_COLOR[f.severity]}-500/10`}>
                                        {f.severity}
                                      </span>
                                      <span className="text-[10px] text-slate-600 font-mono uppercase">{new Date(f.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <h4 className="text-white font-bold text-lg mb-2">{f.data.info?.name || f.tool + " Finding"}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{f.data.info?.description || "Execution evidence recorded."}</p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="logs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="bg-[#050505] rounded-3xl border border-white/5 p-8 font-mono text-[13px] leading-relaxed shadow-2xl h-[600px] flex flex-col">
                      <div className="flex items-center justify-between mb-6 text-slate-600 border-b border-white/5 pb-4">
                         <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-widest">Scanner Output Trace</span>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-1">
                        {logs.map((l, i) => (
                          <div key={l.id} className="text-slate-400 animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="text-slate-700 mr-4">[{i+1}]</span>
                            {l.message}
                          </div>
                        ))}
                        <div ref={logEndRef} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Box({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
}

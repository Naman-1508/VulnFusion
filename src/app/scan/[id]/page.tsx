"use client";

import { useEffect, useState, useRef, use } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Terminal, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Globe, 
  Cpu,
  Lock,
  Activity,
  Zap,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';

interface Scan {
  id: string;
  url: string;
  status: string;
  created_at: string;
}

interface Finding {
  id: string;
  tool: string;
  severity: string;
  data: any;
  url?: string; // Added optional url
  created_at: string;
}

interface ScanLog {
  id: string;
  message: string;
  created_at: string;
}

export default function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scan, setScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [activeTab, setActiveTab] = useState<'findings' | 'logs'>('findings');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      console.log('--- INITIALIZING SCAN DATA FETCH ---');
      const { data: s, error: se } = await supabase.from('scans').select('*').eq('id', id).single();
      if (se) console.error('SUPABASE_ERROR (scans):', se.message);
      
      const { data: f, error: fe } = await supabase.from('findings').select('*').eq('scan_id', id);
      if (fe) console.error('SUPABASE_ERROR (findings):', fe.message);
      
      const { data: l, error: le } = await supabase.from('scan_logs').select('*').eq('scan_id', id).order('created_at', { ascending: true });
      if (le) console.error('SUPABASE_ERROR (scan_logs):', le.message);
      
      if (s) setScan(s);
      if (f) setFindings(f);
      if (l) setLogs(l);

      if (!s && !se) console.warn('No scan found with ID:', id);
    };

    init();

    // REALTIME SUBSCRIPTIONS
    const scanSub = supabase.channel(`scan-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scans', filter: `id=eq.${id}` }, 
        (payload) => setScan(payload.new as Scan))
      .subscribe();

    const findingsSub = supabase.channel(`findings-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'findings', filter: `scan_id=eq.${id}` }, 
        (payload) => setFindings(prev => [...prev, payload.new as Finding]))
      .subscribe();

    const logsSub = supabase.channel(`logs-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_logs', filter: `scan_id=eq.${id}` }, 
        (payload) => setLogs(prev => [...prev, payload.new as ScanLog]))
      .subscribe();

    return () => {
      supabase.removeChannel(scanSub);
      supabase.removeChannel(findingsSub);
      supabase.removeChannel(logsSub);
    };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current && activeTab === 'logs') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  if (!scan) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 blur-lg bg-cyan-500/20 animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500/30">
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150"></div>
      </div>

      {/* HEADER */}
      <header className="relative border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/5">
              <LayoutDashboard size={18} className="text-slate-400 group-hover:text-cyan-400" />
              <span className="text-sm font-medium text-slate-400 group-hover:text-white uppercase tracking-widest">Back to Hub</span>
            </Link>
            <div className="h-8 w-px bg-white/10"></div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-tighter mb-1">
                <Activity size={12} />
                Scanning Live Target
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {scan.url}
                <Globe size={16} className="text-slate-500" />
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] border flex items-center gap-2 transition-all duration-500 ${
              scan.status === 'COMPLETED' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                : scan.status === 'FAILED'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                scan.status === 'COMPLETED' ? 'bg-emerald-400' : scan.status === 'FAILED' ? 'bg-rose-400' : 'bg-cyan-400 shadow-[0_0_8px_cyan]'
              }`}></div>
              {scan.status}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SIDEBAR NAVIGATION */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2 backdrop-blur-sm">
              <button 
                onClick={() => setActiveTab('findings')}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all ${
                  activeTab === 'findings' 
                    ? 'bg-cyan-500/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield size={20} className={activeTab === 'findings' ? 'text-cyan-400' : 'text-slate-500'} />
                  <span className="font-semibold tracking-tight">Vulnerabilities</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                  activeTab === 'findings' ? 'bg-cyan-400 text-black' : 'bg-white/10 text-slate-500'
                }`}>
                  {findings.length}
                </span>
              </button>
              
              <button 
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-xl mt-1 transition-all ${
                  activeTab === 'logs' 
                    ? 'bg-cyan-500/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Terminal size={20} className={activeTab === 'logs' ? 'text-cyan-400' : 'text-slate-500'} />
                  <span className="font-semibold tracking-tight">Engine Trace</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${logs.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`}></div>
              </button>
            </div>

            {/* SCAN DETAILS CARD */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-sm space-y-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                  <Cpu size={12} /> Scan Metadata
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Execution ID</span>
                    <code className="text-xs text-cyan-400/80 bg-cyan-400/5 px-2 py-1 rounded border border-cyan-400/10 truncate">{id}</code>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Started At</span>
                    <span className="text-xs text-slate-300 font-medium">{new Date(scan.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Security Level</span>
                    <span className="text-xs text-rose-400 font-black flex items-center gap-1 uppercase italic tracking-widest">
                      <Lock size={12} /> Advanced Pro
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 text-white/10 group-hover:text-cyan-400 transition-colors">
                    <Zap size={24} />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">Status Report</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {scan.status === 'COMPLETED' 
                      ? 'Scan sequence successfully completed. Results verified.' 
                      : 'Scanner is currently navigating through target attack surface.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeTab === 'findings' ? (
                <motion.div 
                  key="findings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {findings.length === 0 ? (
                    <div className="h-[500px] flex flex-col items-center justify-center text-center bg-white/[0.01] border-2 border-dashed border-white/5 rounded-3xl p-12 overflow-hidden relative group">
                      <div className="absolute inset-0 bg-cyan-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative mb-6">
                        {scan.status === 'COMPLETED' ? (
                          <CheckCircle2 size={64} className="text-emerald-500" />
                        ) : (
                          <Search size={64} className="text-slate-700 animate-pulse" />
                        )}
                        <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full"></div>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                        {scan.status === 'COMPLETED' ? 'Assessment Complete' : 'Listening for vulnerabilities...'}
                      </h2>
                      <p className="text-slate-500 max-w-sm leading-relaxed text-sm">
                        {scan.status === 'COMPLETED' 
                          ? 'All automated engines have finished. No high-risk vulnerabilities were identified in the primary target surface.' 
                          : 'As soon as the engines detect a weakness, it will manifest here in real-time.'}
                      </p>
                      
                      {/* SIMULATED SCAN WAVE */}
                      <div className="mt-12 flex gap-1">
                        {[...Array(20)].map((_, i) => (
                          <motion.div 
                            key={i}
                            animate={{ height: [4, 20, 4] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                            className="w-1 bg-cyan-500/20 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {findings.map((f, i) => (
                        <motion.div 
                          key={f.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 p-5 rounded-2xl group transition-all"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl ${
                                f.severity === 'Critical' ? 'bg-rose-500/10 text-rose-400' :
                                f.severity === 'High' ? 'bg-orange-500/10 text-orange-400' :
                                f.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-cyan-500/10 text-cyan-400'
                              }`}>
                                <AlertTriangle size={20} />
                              </div>
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1 mb-0.5">
                                  <Zap size={10} className="text-cyan-400" />
                                  {f.tool}
                                </div>
                                <h4 className="font-bold text-white tracking-tight leading-tight uppercase italic">{f.data.info?.name || f.data.template || 'Potential Vulnerability'}</h4>
                              </div>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${
                                f.severity === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                f.severity === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                f.severity === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                              }`}>
                              {f.severity}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {f.data.info?.description || 'Detected potential security flaw during automated asset inspection.'}
                            </p>
                            <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-slate-300 break-all leading-relaxed relative group/code overflow-hidden">
                              <div className="text-cyan-400/50 mb-1 flex items-center justify-between">
                                <span className="uppercase text-[9px] tracking-widest font-black">Target Component</span>
                                <ChevronRight size={12} />
                              </div>
                              {f.data.matched || f.url || scan.url}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="logs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative group h-[700px]"
                >
                  {/* TERMINAL EFFECTS */}
                  <div className="absolute inset-0 bg-[#0a0f1d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 justify-between">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/30"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30"></div>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 italic">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        Authenticated Terminal Session
                      </div>
                      <div className="w-8"></div>
                    </div>
                    
                    <div 
                      ref={scrollRef}
                      className="h-[calc(100%-40px)] overflow-y-auto p-6 font-mono text-sm space-y-2 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent custom-terminal"
                    >
                      {/* SCAN LINES EFFECT */}
                      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] z-[1]"></div>
                      
                      <div className="text-emerald-500/50 mb-4 animate-pulse">
                        [SYSTEM INITIALIZED - ROOT PRIVILEGES GRANTED]
                      </div>
                      
                      {logs.length === 0 ? (
                        <div className="flex items-center gap-3 text-slate-600 italic">
                          <span className="animate-bounce">_</span>
                          Waiting for remote worker handshake...
                        </div>
                      ) : (
                        logs.map((log, i) => (
                          <div key={log.id} className="flex gap-4 group/log border-l border-white/5 pl-4 hover:border-cyan-500/50 transition-colors py-0.5">
                            <span className="text-[10px] text-slate-600 w-24 shrink-0 font-bold tabular-nums">
                              {new Date(log.created_at).toLocaleTimeString([], { hour12: false })}
                            </span>
                            <span className={`text-[13px] ${
                              log.message.includes('ERROR') ? 'text-rose-400' :
                              log.message.includes('Smart') ? 'text-cyan-400' :
                              log.message.includes('SUCCESS') ? 'text-emerald-400' :
                              'text-slate-300'
                            }`}>
                              {log.message}
                            </span>
                          </div>
                        ))
                      )}
                      <div className="h-10"></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-terminal::-webkit-scrollbar { width: 4px; }
        .custom-terminal::-webkit-scrollbar-track { background: transparent; }
        .custom-terminal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-terminal {
          text-shadow: 0 0 5px rgba(0, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

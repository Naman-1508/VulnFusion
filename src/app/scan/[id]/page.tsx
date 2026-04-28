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
  LayoutDashboard,
  Bug,
  Database,
  Eye,
  Crosshair,
  Server
} from 'lucide-react';
import { SeverityChart } from '@/components/SeverityChart';
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
  url?: string;
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
    <div className="min-h-screen bg-[#020617] text-slate-100 font-inter selection:bg-cyan-500/30 pb-20 overflow-hidden">
      {/* HUD HEADER */}
      <header className="fixed top-0 inset-x-0 z-[100] bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5 px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all group">
            <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
          </Link>
          <div className="h-8 w-px bg-white/10"></div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className={`w-2 h-2 rounded-full ${scan.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-cyan-500 animate-pulse'} shadow-[0_0_10px_rgba(34,211,238,0.5)]`}></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
                {scan.status === 'COMPLETED' ? 'Mission Success' : 'Live Asset Reconnaissance'}
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white">
              {scan.url.replace('https://', '').replace('http://', '')}
            </h1>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Findings</span>
              <span className="text-xl font-black text-cyan-400 tabular-nums">{findings.length.toString().padStart(2, '0')}</span>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Severity Index</span>
              <span className="text-xl font-black text-rose-500 italic uppercase tracking-tighter">Advanced</span>
           </div>
           <div className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
             scan.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
           }`}>
             {scan.status}
           </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto pt-32 px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* TACTICAL SIDEBAR */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full"></div>
            
            <nav className="space-y-2 relative z-10">
              <button 
                onClick={() => setActiveTab('findings')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                  activeTab === 'findings' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bug size={18} />
                  <span className="text-sm font-black uppercase tracking-tight italic">Threat Log</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === 'findings' ? 'bg-cyan-500 text-black' : 'bg-white/5'}`}>
                  {findings.length}
                </span>
              </button>
              
              <button 
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                  activeTab === 'logs' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Terminal size={18} />
                  <span className="text-sm font-black uppercase tracking-tight italic">System Output</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
              </button>
            </nav>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 space-y-6 relative overflow-hidden group">
            {scan.status !== 'COMPLETED' && (
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
                <motion.div 
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                    scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_340deg,rgba(34,211,238,0.2)_360deg)]"
                />
              </div>
            )}

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2 relative z-10">
                <Activity size={12} className={scan.status !== 'COMPLETED' ? 'text-cyan-400 animate-pulse' : ''} /> 
                Severity Distribution
              </h3>
              <div className="relative z-10">
                <SeverityChart vulnerabilities={findings} />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Crosshair size={12} /> Target Metadata
              </h3>
              <div className="space-y-4">
                <MetadataRow label="ID" value={id.slice(0, 12) + '...'} mono />
                <MetadataRow label="Launched" value={new Date(scan.created_at).toLocaleTimeString()} />
                <MetadataRow label="Engine" value="VulnFusion v2.0" />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 relative z-10">
              <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: scan.status === 'COMPLETED' ? '100%' : '65%' }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                />
              </div>
              <div className="flex justify-between mt-3">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Progress_Index</span>
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest tabular-nums">
                   {scan.status === 'COMPLETED' ? '100%' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN DISPLAY AREA */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === 'findings' ? (
              <motion.div 
                key="findings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar"
              >
                {findings.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[40px] p-20">
                    <div className="relative mb-8">
                       <div className="w-24 h-24 bg-cyan-500/5 rounded-full blur-3xl absolute inset-0"></div>
                       {scan.status === 'COMPLETED' ? (
                         <CheckCircle2 size={64} className="text-emerald-500 relative z-10" />
                       ) : (
                         <Search size={64} className="text-slate-700 animate-pulse relative z-10" />
                       )}
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3 tracking-tighter uppercase italic">
                      {scan.status === 'COMPLETED' ? 'Perimeter Clean' : 'Scanning Surface...'}
                    </h2>
                    <p className="text-slate-500 max-w-sm leading-relaxed text-sm font-medium">
                      {scan.status === 'COMPLETED' 
                        ? 'Assessment successfully synchronized. No critical entry points were identified in this session.' 
                        : 'Deploying distributed agents to identify potential vulnerabilities in real-time.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                    {findings.map((f, i) => (
                      <FindingCard key={f.id} finding={f} index={i} targetUrl={scan.url} />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-[calc(100vh-200px)] flex flex-col"
              >
                <div className="flex-1 bg-[#0a0f1d] border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none"></div>
                  
                  <div className="h-12 bg-white/5 border-b border-white/5 flex items-center px-6 justify-between">
                    <div className="flex items-center gap-4">
                       <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/30"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/30"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30"></div>
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Console_Stream.log</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                       <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Piping Live Output</span>
                    </div>
                  </div>

                  <div 
                    ref={scrollRef}
                    className="flex-1 p-6 font-mono text-[11px] leading-relaxed overflow-y-auto custom-scrollbar selection:bg-cyan-500/30"
                  >
                    <div className="space-y-1.5">
                      {logs.map((log, i) => (
                        <div key={`${log.id}-${i}`} className="group flex gap-4">
                          <span className="text-slate-700 w-20 shrink-0 tabular-nums">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                          <span className={`${
                            log.message.includes('Error') ? 'text-rose-400' :
                            log.message.includes('complete') ? 'text-emerald-400' :
                            log.message.includes('Phase') ? 'text-cyan-400 font-bold underline decoration-cyan-500/30 underline-offset-4' :
                            'text-slate-300'
                          }`}>
                            {log.message}
                          </span>
                        </div>
                      ))}
                      {scan.status !== 'COMPLETED' && (
                        <div className="flex gap-4 items-center animate-pulse mt-4">
                           <span className="text-slate-700 w-20 shrink-0">--:--:--</span>
                           <span className="text-cyan-500 font-black tracking-widest">_ AWAITING_OUTPUT...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function MetadataRow({ label, value, mono = false }: { label: string, value: string, mono?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</span>
      <span className={`text-[11px] font-black ${mono ? 'font-mono text-cyan-400' : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

function FindingCard({ finding, index, targetUrl }: { finding: Finding, index: number, targetUrl: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const isCritical = finding.severity === 'Critical' || finding.severity === 'High';
  
  const displayName = finding.data.name || finding.data.info?.name || finding.data.template || 'Anomaly Detected';
  const displayDesc = finding.data.description || finding.data.info?.description || 'Strategic intelligence suggests a potential exploit path at this component node.';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => setIsOpen(true)}
        className={`group relative p-6 rounded-[32px] border cursor-pointer transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] ${
          isCritical 
            ? 'bg-rose-500/[0.03] border-rose-500/10 hover:border-rose-500/40' 
            : 'bg-white/[0.02] border-white/5 hover:border-cyan-500/40'
        }`}
      >
        {/* GLOW EFFECT */}
        <div className={`absolute -inset-1 rounded-[34px] blur opacity-0 group-hover:opacity-20 transition duration-500 ${
          isCritical ? 'bg-rose-500' : 'bg-cyan-500'
        }`}></div>

        <div className="relative flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${
                finding.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]' :
                finding.severity === 'High' ? 'bg-orange-500/20 text-orange-400' :
                finding.severity === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                'bg-cyan-500/20 text-cyan-400'
              }`}>
                {finding.tool === 'SQLMap' ? <Database size={20} /> : 
                 finding.tool === 'Nikto' ? <Server size={20} /> :
                 finding.tool === 'XSStrike' ? <Zap size={20} /> :
                 <Bug size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{finding.tool}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{new Date(finding.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h4 className="font-black text-white leading-none uppercase tracking-tighter italic text-lg group-hover:text-cyan-400 transition-colors">
                  {displayName}
                </h4>
              </div>
            </div>
            <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
               finding.severity === 'Critical' ? 'bg-rose-500 text-white border-rose-400' :
               finding.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
               finding.severity === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
               'bg-white/5 text-slate-400 border-white/10'
            }`}>
              {finding.severity}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2">
              {displayDesc}
            </p>
            
            <div className="p-3 bg-black/40 border border-white/5 rounded-2xl overflow-hidden group/target transition-colors hover:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Component_ID</span>
                <Eye size={10} className="text-slate-700 group-hover/target:text-cyan-400 transition-colors" />
              </div>
              <div className="font-mono text-[9px] text-slate-300 break-all leading-relaxed line-clamp-1">
                {finding.data.matched || finding.url || targetUrl}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic underline decoration-slate-800 underline-offset-4 group-hover:text-cyan-400 group-hover:decoration-cyan-500/30">Analyze Evidence</span>
             <ChevronRight size={14} className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </motion.div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a0f1d] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className={`h-2 w-full ${isCritical ? 'bg-rose-500' : 'bg-cyan-500'}`}></div>
              
              <div className="p-8 md:p-12 overflow-y-auto max-h-[80vh] custom-scrollbar">
                <div className="flex justify-between items-start mb-8">
                   <div>
                     <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black text-cyan-500 uppercase tracking-[0.3em] italic">{finding.tool} REPORT</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{new Date(finding.created_at).toLocaleString()}</span>
                     </div>
                     <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">{displayName}</h2>
                   </div>
                   <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                      <LayoutDashboard size={24} className="rotate-45" />
                   </button>
                </div>

                <div className="space-y-8">
                   <section>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Tactical Intelligence</h5>
                      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl leading-relaxed text-slate-300">
                         {displayDesc}
                      </div>
                   </section>

                   <section>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Raw Evidence Log</h5>
                      <div className="p-6 bg-black rounded-3xl font-mono text-xs text-emerald-500/80 border border-emerald-500/10 overflow-x-auto whitespace-pre-wrap">
                         {JSON.stringify(finding.data, null, 2)}
                      </div>
                   </section>

                   <div className="flex gap-4 pt-4">
                      <div className="flex-1 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                         <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Severity</span>
                         <span className={`text-sm font-black uppercase italic ${isCritical ? 'text-rose-500' : 'text-cyan-500'}`}>{finding.severity}</span>
                      </div>
                      <div className="flex-1 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                         <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</span>
                         <span className="text-sm font-black uppercase italic text-white">Unresolved</span>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Plus, 
  Search, 
  History, 
  ChevronRight, 
  Activity, 
  Globe, 
  Zap,
  LayoutGrid,
  List,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Scan {
  id: string;
  url: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [url, setUrl] = useState('');
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const router = useRouter();

  useEffect(() => {
    const fetchScans = async () => {
      const { data } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setScans(data);
    };

    fetchScans();

    const channel = supabase.channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scans' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setScans(prev => [payload.new as Scan, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setScans(prev => prev.map(s => s.id === payload.new.id ? payload.new as Scan : s));
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.id) router.push(`/scan/${data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-20">
      {/* AMBIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[150px] rounded-full"></div>
      </div>

      {/* HERO SECTION */}
      <div className="relative border-b border-white/5 bg-black/20 backdrop-blur-xl pt-16 pb-24 overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
         
         <div className="max-w-4xl mx-auto px-6 relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <Zap size={12} fill="currentColor" />
                Vulnerability Orchestration Engine
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                VulnFusion <span className="text-cyan-400 italic">Pro</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                Connect your intelligence stream. Deploy distributed scanning agents. 
                Visualize the attack surface in high-fidelity.
              </p>
            </motion.div>

            <motion.form 
              onSubmit={startScan}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[28px] blur opacity-20 group-focus-within:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-[24px] p-2 overflow-hidden shadow-2xl">
                <div className="flex-1 flex items-center px-6">
                  <Globe className="text-slate-500 mr-4 group-focus-within:text-cyan-400 transition-colors" size={20} />
                  <input 
                    type="url" 
                    placeholder="https://target-domain.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-transparent border-none outline-none text-white w-full font-medium placeholder:text-slate-600"
                    required
                  />
                </div>
                <button 
                  disabled={loading}
                  className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-[18px] hover:bg-cyan-400 hover:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:bg-white active:scale-95"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Zap size={18} fill="currentColor" />
                      Engage
                    </>
                  )}
                </button>
              </div>
            </motion.form>
         </div>
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <History size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white uppercase italic">Mission History</h2>
              <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Archive of active and legacy scans</p>
            </div>
          </div>

          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {scans.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[32px] text-slate-500 italic">
            <Activity className="mb-4 text-slate-700" size={32} />
            No active mission data found.
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            <AnimatePresence>
              {scans.map((scan, i) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link href={`/scan/${scan.id}`} className="block">
                    <div className={`group relative bg-white/[0.02] border border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.04] p-6 rounded-[24px] transition-all duration-300 ${
                      viewMode === 'list' ? 'flex items-center justify-between py-4' : ''
                    }`}>
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl bg-gradient-to-br transition-all duration-500 group-hover:scale-110 ${
                          scan.status === 'COMPLETED' ? 'from-emerald-500/20 to-teal-500/10 text-emerald-400' :
                          scan.status === 'FAILED' ? 'from-rose-500/20 to-red-500/10 text-rose-400' :
                          'from-cyan-500/20 to-blue-500/10 text-cyan-400'
                        }`}>
                          <Shield size={24} fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <div>
                          <h3 className="font-black text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors truncate max-w-[200px]">
                            {scan.url.replace('https://', '').replace('http://', '')}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                              {new Date(scan.created_at).toLocaleDateString()}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              scan.status === 'COMPLETED' ? 'text-emerald-500' :
                              scan.status === 'FAILED' ? 'text-rose-500' :
                              'text-cyan-500 animate-pulse'
                            }`}>
                              {scan.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {viewMode === 'grid' ? (
                        <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/5">
                           <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                             ID: {scan.id.slice(0, 8)}...
                           </div>
                           <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-cyan-400 group-hover:text-black transition-all">
                             <ChevronRight size={16} />
                           </div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-cyan-400 group-hover:text-black transition-all">
                          <ChevronRight size={20} />
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

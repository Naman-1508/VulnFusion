"use client";

import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Lock, Cpu, BarChart3, ChevronRight, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500/30 overflow-hidden">
      {/* 3D GRID BACKGROUND */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.15]" 
          style={{
            backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'perspective(1000px) rotateX(60deg) translateY(-200px) scale(2)',
            transformOrigin: 'top'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent"></div>
      </div>

      {/* AMBIENT GLOWS */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[150px] rounded-full"></div>

      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded-xl rotate-3 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <Shield className="text-black" size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic">VulnFusion <span className="text-cyan-400">Pro</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          <Link href="#features" className="hover:text-cyan-400 transition-colors">Tactical Capabilities</Link>
          <Link href="#arch" className="hover:text-cyan-400 transition-colors">Node Network</Link>
          <Link href="/dashboard" className="px-5 py-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all">Command Dashboard</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
          >
            <Zap size={14} fill="currentColor" className="animate-pulse" />
            Distributed Security Intelligence v2.0
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.9]"
          >
            THE NEW ERA OF <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">OFFENSIVE SCANNING</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto mb-12 font-medium leading-relaxed"
          >
            VulnFusion bypasses traditional constraints by leveraging high-performance GitHub Cloud nodes. 
            Real-time vulnerability streaming, interactive command logs, and zero-latency analysis.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href="/dashboard" className="group relative">
              <div className="absolute -inset-1 bg-cyan-400 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative px-10 py-5 bg-white text-black font-black uppercase tracking-widest rounded-xl flex items-center gap-3 transition-transform active:scale-95">
                <Terminal size={20} fill="currentColor" />
                Initialize Console
                <ChevronRight size={18} />
              </div>
            </Link>
            <Link href="#arch" className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all backdrop-blur-xl">
              Platform Architecture
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section id="features" className="relative z-10 py-32 px-6 bg-black/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Globe className="text-cyan-400" />}
              title="Global Node Network"
              desc="Scans are executed across distributed cloud agents, ensuring high availability and zero local resource usage."
            />
            <FeatureCard 
              icon={<Cpu className="text-blue-400" />}
              title="Tech Fingerprinting"
              desc="Automatically detects target stack components (WordPress, PHP, JS) to deploy specialized assessment modules."
            />
            <FeatureCard 
              icon={<Lock className="text-purple-400" />}
              title="Encrypted Intelligence"
              desc="Results are streamed through a secure Supabase tunnel directly to your dashboard with military-grade encryption."
            />
          </div>
        </div>
      </section>

      {/* ARCHITECTURE PREVIEW */}
      <section id="arch" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-8 italic uppercase">
              Distributed <span className="text-cyan-400">Orchestration</span>
            </h2>
            <div className="space-y-8">
              <ArchStep number="01" title="Target Initiation" desc="User submits URL via the Command Center UI." />
              <ArchStep number="02" title="Agent Dispatch" desc="GitHub Action runners spin up fresh Ubuntu containers." />
              <ArchStep number="03" title="Assessment Phase" desc="Nuclei, SQLMap, and Nikto execute in parallel." />
              <ArchStep number="04" title="Real-time Stream" desc="Findings are piped back to your dashboard via WebSockets." />
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute -inset-4 bg-cyan-500/20 blur-3xl rounded-full"></div>
            <div className="relative aspect-square bg-[#0f172a] border border-white/10 rounded-[40px] overflow-hidden p-8 shadow-2xl">
               <div className="h-full border border-white/5 rounded-[24px] bg-black/40 p-6 font-mono text-[10px] text-cyan-400/60 leading-relaxed">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                    <span className="text-rose-500 uppercase font-black">Live Data Stream</span>
                  </div>
                  <div className="space-y-1">
                    <p>[09:42:11] INITIALIZING WORKER_NODE_7...</p>
                    <p>[09:42:12] TARGET_RESOLVED: testphp.vulnweb.com</p>
                    <p>[09:42:15] RUNNING_ENGINE: NUCLEI_ASSESSOR</p>
                    <p className="text-white">[09:42:18] FINDING_DETECTED: CVE-2024-XXXX</p>
                    <p>[09:42:20] PIPE_ESTABLISHED: SUPABASE_REALTIME</p>
                    <p className="text-cyan-400">[09:42:22] SYNCING_MANIFEST...</p>
                    <p>[09:42:25] AGENT_IDLE: AWAITING_NEXT_COMMAND</p>
                  </div>
                  {/* GRAPHIC OVERLAY */}
                  <div className="mt-12 flex justify-between items-end h-32 gap-1">
                    {[40, 70, 45, 90, 65, 30, 85, 50, 95, 40, 70].map((h, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse', delay: i * 0.1 }}
                        className="flex-1 bg-gradient-to-t from-cyan-500/20 to-cyan-400 rounded-t-sm"
                      />
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-12 px-8 border-t border-white/5 text-center">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">
          &copy; 2024 VulnFusion // Terminal Grade Security
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="group p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.05] transition-all duration-500">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight italic">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function ArchStep({ number, title, desc }: any) {
  return (
    <div className="flex gap-6 group">
      <div className="text-2xl font-black text-slate-800 group-hover:text-cyan-500/40 transition-colors tabular-nums">{number}</div>
      <div>
        <h4 className="text-white font-black uppercase tracking-tight mb-1">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

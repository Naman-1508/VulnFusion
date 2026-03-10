"use client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, Server, Activity, Bug, Database, Globe, ChevronRight, Binary, Lock, Box } from "lucide-react";

export default function Home() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />
      
      {/* Premium Navbar */}
      <header className="fixed top-0 z-40 w-full border-b border-white/5 bg-background/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/20">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Vuln<span className="text-cyan-400">Fusion</span></span>
          </div>
          <nav className="flex items-center gap-8">
            <Link href="/dashboard" className="text-sm font-medium text-slate-400 transition-colors hover:text-cyan-400">Platform</Link>
            <Link href="/dashboard" className="text-sm font-medium text-slate-400 transition-colors hover:text-cyan-400">Architecture</Link>
            <Link 
              href="/dashboard"
              className="group relative inline-flex h-10 items-center justify-center rounded-full bg-slate-800 px-6 text-sm font-medium text-white transition-all hover:bg-slate-700"
            >
              <span className="relative z-10 flex items-center gap-2">Initialize Console <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
              <div className="absolute -inset-0.5 -z-10 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 opacity-0 blur transition-opacity duration-300 group-hover:opacity-40" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-32 pb-24">
        {/* Massive Hero Section */}
        <section className="container mx-auto px-6 pt-20 pb-32 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative z-10">
            <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
              </span>
              Engine v2.0 Next-Gen Architecture Deployed
            </div>
            
            <h1 className="mx-auto mb-8 max-w-5xl text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-[5.5rem] leading-[1.1]">
              Continuous Attack Surface <br className="hidden md:block" />
              <span className="text-gradient-cyan">Intelligence & Mapping</span>
            </h1>
            
            <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-400 leading-relaxed font-light">
              VulnFusion orchestrates military-grade security engines (Nuclei, SQLMap, XSStrike, Subfinder) into a singular, unified threat intelligence platform. 
              Gain absolute visibility over your infrastructure vulnerabilities instantly.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard" className="group relative inline-flex h-14 w-full items-center justify-center rounded-xl bg-white px-8 text-base font-bold text-slate-900 transition-all hover:scale-105 active:scale-95 sm:w-auto shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(14,165,233,0.5)]">
                Access Command Center
                <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Abstract Interface Mockup */}
          <motion.div style={{ y: y2 }} className="relative mx-auto mt-24 max-w-6xl z-0 perspective-[2000px]">
            <motion.div initial={{ rotateX: 20, opacity: 0, y: 50 }} animate={{ rotateX: 0, opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
              className="glass-panel overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl shadow-cyan-900/20 relative"
            >
              {/* Header */}
              <div className="flex h-12 items-center justify-between border-b border-white/5 bg-slate-900/50 px-4">
                <div className="flex gap-2"><div className="h-3 w-3 rounded-full bg-rose-500"/><div className="h-3 w-3 rounded-full bg-amber-500"/><div className="h-3 w-3 rounded-full bg-emerald-500"/></div>
                <div className="text-xs font-mono text-slate-500">vF-CORE_ANALYTICS // active_scan</div>
              </div>
              {/* Body */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-white/5">
                {/* Sidebar */}
                <div className="bg-slate-900/80 p-6 col-span-1 hidden md:flex flex-col gap-4">
                  <div className="h-8 w-2/3 rounded-md bg-slate-800 animate-pulse" />
                  <div className="h-4 w-full rounded-md bg-slate-800/50" />
                  <div className="h-4 w-4/5 rounded-md bg-slate-800/50" />
                  <div className="h-4 w-5/6 rounded-md bg-slate-800/50" />
                  <div className="mt-8 h-32 w-full rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/5 flex items-center justify-center pb-4 pt-4">
                    <div className="relative w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center">
                       <span className="text-xs font-bold text-cyan-400">92%</span>
                       <svg className="absolute inset-0 w-full h-full -rotate-90"><circle cx="50%" cy="50%" r="45%" fill="none" stroke="#0ea5e9" strokeWidth="10%" strokeDasharray="100 100" strokeDashoffset="20"></circle></svg>
                    </div>
                  </div>
                </div>
                {/* Main Content */}
                <div className="col-span-1 md:col-span-3 bg-slate-950 p-6 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-1/3 rounded-md bg-slate-800" />
                    <div className="h-6 w-24 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-24 rounded-xl border border-white/5 bg-slate-900/50 p-4 flex flex-col justify-between">
                         <div className="h-3 w-8 rounded-full bg-slate-800"/>
                         <div className="h-8 w-16 rounded-md bg-slate-700"/>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 rounded-xl border border-white/5 bg-slate-900/40 p-4">
                    <div className="space-y-3">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex items-center gap-4 border-b border-white/5 pb-3">
                          <div className={`h-2 w-2 rounded-full ${i===1?'bg-red-500':i===2?'bg-orange-500':'bg-blue-500'}`} />
                          <div className="h-3 w-1/4 rounded bg-slate-700"/>
                          <div className="h-3 w-1/2 rounded bg-slate-800"/>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Scanline effect over mockup */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20"/>
            </motion.div>
          </motion.div>
        </section>

        {/* Bento Box Feature Grid */}
        <section className="container mx-auto px-6 py-24">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Unified Attack Surface Intelligence</h2>
            <p className="text-slate-400 max-w-2xl text-lg">Five distinct security engines running asynchronously, combining their data streams into a single, cohesive threat model.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Large Card */}
            <div className="col-span-1 md:col-span-2 glass-card rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500"><Shield className="w-48 h-48" /></div>
              <div className="relative z-10 w-full h-full flex flex-col justify-between">
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-6 border border-rose-500/20">
                    <Server className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Nuclei Template Engine</h3>
                  <p className="text-slate-400 leading-relaxed max-w-md">Execute thousands of YAML-based vulnerability templates to detect misconfigurations, default credentials, and critical CVEs across your entire infrastructure in milliseconds.</p>
                </div>
              </div>
            </div>

            {/* Small Stack */}
            <div className="col-span-1 flex flex-col gap-6">
              <div className="glass-card rounded-3xl p-6 flex-1 relative overflow-hidden group">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4 border border-cyan-500/20">
                  <Globe className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Passive Subfinder</h3>
                <p className="text-sm text-slate-400">Lightning-fast passive subdomain enumeration utilizing multiple global data sources.</p>
              </div>
              <div className="glass-card rounded-3xl p-6 flex-1 relative overflow-hidden group">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 mb-4 border border-violet-500/20">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Advanced SQLMap</h3>
                <p className="text-sm text-slate-400">Automated deep SQL injection detection and database fingerprinting.</p>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="col-span-1 glass-card rounded-3xl p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">XSStrike Payload Fuzzer</h3>
              <p className="text-sm text-slate-400">Intelligent XSS detection using multiple payload generation algorithms.</p>
            </div>
            
            <div className="col-span-1 md:col-span-2 glass-card rounded-3xl p-6 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-violet-500/5 opacity-50" />
               <div className="relative z-10 flex flex-col justify-center h-full sm:flex-row sm:items-center sm:justify-between">
                 <div>
                   <h3 className="text-2xl font-bold text-white mb-2">Ready to secure your perimeter?</h3>
                   <p className="text-slate-400">Deploy VulnFusion and run comprehensive VAPT assessments.</p>
                 </div>
                 <Link href="/dashboard" className="mt-6 sm:mt-0 inline-flex h-12 items-center justify-center rounded-xl bg-white/10 px-8 text-sm font-bold text-white backdrop-blur-md border border-white/20 transition-all hover:bg-white/20 whitespace-nowrap">
                    Launch Platform
                 </Link>
               </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}

function ArrowRightIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

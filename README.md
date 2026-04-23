<div align="center">
  <h1>🛡️ VulnFusion</h1>
  <p><strong>Continuous Attack Surface Intelligence & Vulnerability Mapping</strong></p>
  
  <p>
    <a href="#overview">Overview</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#features">Features</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#local-development">Local Setup</a>
  </p>

  <p>
    <strong>🟢 Live Deployment:</strong> <a href="#">[Add Railway URL here after deploy]</a>
  </p>
</div>

<hr />

## 🛡️ Overview

**VulnFusion** is an enterprise-grade Vulnerability Assessment and Penetration Testing (VAPT) orchestrator. It provides a centralized command center that asynchronously aggregates data from five distinct, industry-standard security engines.

Designed with a premium, data-dense interface, it transforms raw scanner outputs into actionable intelligence cards and data visualizations.

---

## 🏗️ Architecture

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **UI:** Tailwind CSS, Framer Motion, Lucide Icons
- **Database:** Prisma ORM + SQLite
- **Deployment:** Railway (Nixpacks — no Docker required)

### ⚡ Integrated VAPT Engines

1. **Nuclei** — Template-based vulnerability scanner (ProjectDiscovery)
2. **Subfinder** — Passive subdomain enumeration (ProjectDiscovery)
3. **SQLMap** — SQL injection detection and exploitation
4. **XSStrike** — Intelligent XSS payload fuzzer
5. **Nikto** — Web server misconfiguration scanner

---

## ✨ Features

- **Command Center Dashboard** — Real-time scan tracking, metrics, assessment history
- **Glassmorphic UI** — Deep dark mode with ambient orbs, bento-box layouts and noise overlays
- **SVG Donut Charts** — Zero-dependency threat distribution visualizations
- **Evidence Extraction** — Execution traces and reproduction steps per finding
- **Local Binary System** — Tools run from `bin/` folder, no system-level installs required

---

## 🚀 Deployment (Railway)

Railway auto-detects the `nixpacks.toml` and handles everything — Python3, Perl, binary downloads, Prisma, and the Next.js build.

### Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy: VulnFusion on Railway"
   git push origin main
   ```
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select `VulnFusion` → Railway auto-detects `nixpacks.toml`
4. Click **Deploy** — done!
5. Copy your Railway URL and update the Live Deployment link at the top of this README.

> **No Dockerfile. No env vars needed.** Railway uses `nixpacks.toml` which handles Python3, Perl, binary downloads, and the database setup automatically.

---

## 💻 Local Development

```bash
# 1. Clone the repo
git clone https://github.com/Naman-1508/VulnFusion.git
cd VulnFusion

# 2. Install deps + auto-clone sqlmap, xsstrike, nikto into bin/
npm install

# 3. Download nuclei.exe and subfinder.exe manually into bin/
# nuclei:    https://github.com/projectdiscovery/nuclei/releases/latest
# subfinder: https://github.com/projectdiscovery/subfinder/releases/latest

# 4. Init database
npx prisma generate
npx prisma db push

# 5. Run
npm run dev
```

Navigate to `http://localhost:3000`

---

<div align="center">
  <p><i>Use responsibly. Only scan systems you have explicit permission to test.</i></p>
</div>

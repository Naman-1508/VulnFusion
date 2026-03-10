<div align="center">
  <img src="public/favicon.ico" alt="VulnFusion Logo" width="120" />
  <h1>VulnFusion</h1>
  <p><strong>Continuous Attack Surface Intelligence & Vulnerability Mapping</strong></p>
  
  <p>
    <a href="#overview">Overview</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#features">Features</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#local-development">Local Setup</a>
  </p>

  <p>
    <!-- REPLACE '#' WITH YOUR ACTUAL RENDER URL LATER -->
    <strong>🔴 Live Sandbox Deployment:</strong> <a href="#"></a>
  </p>
</div>

<hr />

## 🛡️ Overview

**VulnFusion** is an enterprise-grade Vulnerability Assessment and Penetration Testing (VAPT) orchestrator. Moving beyond traditional single-tool execution, VulnFusion provides a centralized, high-performance command center that asynchronously aggregates data streams from five distinct, industry-standard security engines. 

Designed with a premium, data-dense Palantir-inspired interface, it transforms raw terminal outputs into highly actionable intelligence cards, custom Data Visualizations, and PDF reports.

---

## 🏗️ Architecture

The platform runs on a modern decoupled stack optimized for containerized deployment:

- **Frontend Core:** Next.js 14 (App Router), React, TypeScript
- **UI Engine:** Tailwind CSS, Framer Motion (Hardware-accelerated animations), Lucide Icons
- **Data Layer:** Prisma ORM
- **Containerization:** Docker (Debian bullseye-slim) injecting Go, Python3, and Perl

### ⚡ Integrated Intelligence Engines

VulnFusion comes pre-configured to execute and parse outputs from the following utilities:
1. **Nuclei (ProjectDiscovery):** High-speed, template-based vulnerability scanner.
2. **Subfinder (ProjectDiscovery):** Passive subdomain enumeration.
3. **SQLMap:** Automatic SQL injection detection and database fingerprinting.
4. **XSStrike:** Intelligent XSS payload generation and fuzzing.
5. **Nikto:** Comprehensive web server misconfiguration scanning.

---

## ✨ Features

- **Command Center Dashboard:** Real-time tracking of active and historical scans, metrics, and targets.
- **Glassmorphic UI:** Deep dark mode aesthetics with ambient radiant orbs, complex bento-box layouts, and noise overlays. 
- **Bespoke Visualizations:** Zero-dependency SVG donut charts calculating threat distribution seamlessly.
- **Evidence Extraction:** Direct retrieval of execution traces and matched reproduction steps.
- **Dockerized Execution Context:** The included `Dockerfile` ensures that the Node environment compiles and seamlessly binds the CLI dependencies (Go, Perl, Python) required for authentic execution in production environments.

---

## 🚀 Deployment (Production)

To achieve **genuine** security results, VulnFusion must be deployed in an environment capable of executing CLI binaries. We provide a tailored `Dockerfile` and `render.yaml` for a free seamless deployment on **Render.com**.

### One-Click Render Deployment

1. **Commit and Push** this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "Initial VulnFusion Release"
   git push origin main
   ```
2. Log into [Render](https://render.com) and create a **New Web Service**.
3. Connect your GitHub repository.
4. Render will automatically detect the `Dockerfile` and build the container, pulling in Go, NodeJS, Python, and the security toolchain.
5. Select the **Free** tier.
6. Once deployed, **copy the URL and paste it at the top of this README.**

*Note: In local development on Windows machines without the tools installed on the PATH, the backend will elegantly fallback to high-quality mock data arrays to prevent application crashes and allow UI development.*

---

## 💻 Local Development

If you wish to modify the UI or backend logic locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/vulnfusion.git
   cd vulnfusion
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Initialize Prisma (SQLite Default for local):**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Launch the Development Server:**
   ```bash
   npm run dev
   ```
   *Navigate to `http://localhost:3000` to access the console.*

---

<div align="center">
  <p><i>Developed for advanced security posture management. Use responsibly and only on authorized targets.</i></p>
</div>

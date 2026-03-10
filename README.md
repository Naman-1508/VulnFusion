# VulnFusion — Setup & Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Docker Desktop (for PostgreSQL)
- npm

### 1. Start the PostgreSQL database
```bash
docker-compose up -d
```

### 2. Push the database schema
```bash
npx prisma db push
```

### 3. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://vulnfusion:vulnfusionpassword@localhost:5432/vulnfusiondb?schema=public"
```

---

## Security Tools Installation

VulnFusion calls these tools from the system `$PATH`. If they are not installed, it falls back to realistic **mock data** for demo purposes.

| Tool | Install Command |
|------|----------------|
| **Subfinder** | [Go](https://github.com/projectdiscovery/subfinder) — `go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest` |
| **Nikto** | `git clone https://github.com/sullo/nikto` |
| **Nuclei** | `go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest` |
| **SQLMap** | `pip install sqlmap` or clone from [sqlmap.org](https://sqlmap.org) |
| **XSStrike** | `pip install xsstrike` |

> **Without these tools installed, VulnFusion will still show a full demo scan with realistic mock vulnerabilities.**

---

## Demo Targets (Intentionally Vulnerable)

- **DVWA** — `http://dvwa.example.com`
- **OWASP Juice Shop** — `http://juice-shop.example.com`
- **VulnWeb** — `http://testphp.vulnweb.com`

---

## Production Deployment (Vercel + Supabase)

### Database (Supabase)
1. Create a project at [supabase.com](https://supabase.com)
2. Get your `DATABASE_URL` from **Settings → Database → Connection string**

### App (Vercel)
```bash
npm install -g vercel
vercel --prod
```
Set the `DATABASE_URL` environment variable in Vercel project settings.

> **Note:** Security scanner execution via `child_process` won't work on Vercel's serverless functions. For full scanner functionality, deploy on a VPS (e.g., DigitalOcean, Railway) with the tools installed.

---

## Project Structure

```
src/
  app/
    page.tsx               # Landing page
    dashboard/page.tsx     # Dashboard + scan form
    scan/[id]/page.tsx     # Scan results & report
    api/
      scan/route.ts        # POST - start new scan
      scans/route.ts       # GET - list all scans
      scans/[id]/route.ts  # GET - single scan details
  lib/
    prisma.ts              # Prisma singleton
    orchestrator.ts        # Scan pipeline controller
    scanners/
      subfinder.ts         # Subdomain discovery
      nikto.ts             # Web server scanning
      nuclei.ts            # CVE detection
      sqlmap.ts            # SQL injection
      xsstrike.ts          # XSS detection
  components/
    SeverityBadge.tsx      # Color-coded severity labels
    SeverityChart.tsx      # Recharts donut chart

prisma/schema.prisma       # DB schema
docker-compose.yml         # PostgreSQL container
```

---

## Disclaimer

> ⚠️ **This tool is intended strictly for educational purposes and authorized security testing environments.** Unauthorized use against systems you do not own or have explicit permission to test is illegal and unethical.

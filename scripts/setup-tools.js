#!/usr/bin/env node
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const binDir = path.join(__dirname, "..", "bin");

// Ensure bin dir exists
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

console.log("\n🔧 VulnFusion Tool Setup\n");

const isVercel = process.env.VERCEL === "1";

if (isVercel) {
  console.log("🚀 Vercel environment detected. Skipping heavy tool installation.");
  console.log("ℹ️  Note: Security scanners require Python/Perl and may not run on Vercel Serverless Functions.");
  process.exit(0);
}

// Check Python3
let hasPython = false;
try {
  execSync("python3 --version", { stdio: "pipe" });
  console.log("✅ python3 found");
  hasPython = true;
} catch {
  try {
    execSync("python --version", { stdio: "pipe" });
    console.log("✅ python found (used as python3)");
    hasPython = true;
  } catch {
    console.warn("⚠️  WARNING: python3 not found. SQLMap and XSStrike will not work.");
  }
}

// Check Perl
try {
  execSync("perl --version", { stdio: "pipe" });
  console.log("✅ perl found");
} catch {
  console.warn("⚠️  WARNING: perl not found. Nikto will not work.");
}

// Clone helper
function cloneTool(name, repoUrl, targetDir) {
  if (fs.existsSync(targetDir)) {
    console.log(`⏭️  ${name} already exists, skipping clone.`);
    return;
  }
  console.log(`📥 Cloning ${name}...`);
  try {
    execSync(`git clone --depth 1 ${repoUrl} "${targetDir}"`, { stdio: "inherit" });
    console.log(`✅ ${name} cloned successfully.`);
  } catch (err) {
    console.error(`❌ Failed to clone ${name}: ${err.message}`);
  }
}

cloneTool("SQLMap",   "https://github.com/sqlmapproject/sqlmap.git", path.join(binDir, "sqlmap"));
cloneTool("XSStrike", "https://github.com/s0md3v/XSStrike.git",      path.join(binDir, "xsstrike"));
cloneTool("Nikto",    "https://github.com/sullo/nikto.git",           path.join(binDir, "nikto"));

console.log(`
✅ Setup complete!
   - Nuclei/Subfinder: Please ensure binaries are in /bin
   - SQLMap/XSStrike/Nikto: Cloned to /bin
   
   To run in production (Railway/Fly.io): ensure python3 and perl are in the system.
`);

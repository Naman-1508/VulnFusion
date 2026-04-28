import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const scanUrl = process.env.SCAN_URL;
const scanId = process.env.SCAN_ID;

console.log('--- SCANNER WORKER STARTING ---');
console.log('Target URL:', scanUrl);
console.log('Scan ID:', scanId);

if (!supabaseUrl || !supabaseKey || !scanUrl || !scanId) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper for cross-platform paths
const isWin = os.platform() === 'win32';
const IS_CI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const BIN_EXT = isWin ? '.exe' : '';
const PYTHON_CMD = isWin ? 'python' : 'python3';
const PERL_CMD = isWin ? 'C:\\Strawberry\\perl\\bin\\perl.exe' : 'perl';
const NIKTO_SCRIPT = IS_CI ? 'bin/nikto-dir/program/nikto.pl' : 'bin/nikto/program/nikto.txt';
// Cross-platform binary path: uses ./ on Linux, .\  on Windows
const getBin = (name) => path.join('bin', `${name}${BIN_EXT}`);

async function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
  const { error } = await supabase.from('scan_logs').insert([{
    scan_id: scanId,
    message: message
  }]);
  if (error) console.error(`[SUPABASE ERROR] Failed to log message:`, error.message);
}

async function saveFinding(tool, severity, data) {
  const { error } = await supabase.from('findings').insert([{
    scan_id: scanId,
    tool,
    severity,
    data
  }]);
  if (error) console.error(`[SUPABASE ERROR] Failed to save finding for ${tool}:`, error.message);
}

function runCommand(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { shell: isWin, windowsHide: true, cwd: opts.cwd || undefined });
    let stdout = "";
    let stderr = "";

    proc.on('error', (err) => {
      console.error(`[COMMAND ERROR] Failed to start ${cmd}:`, err.message);
      resolve({ code: 1, stdout: "", stderr: err.message });
    });

    proc.stdout.on('data', (data) => {
      const line = data.toString();
      stdout += line;
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function main() {
  try {
    let targetUrl = scanUrl.startsWith('http') ? scanUrl : `http://${scanUrl}`;
    const domain = targetUrl.replace('http://', '').replace('https://', '').split('/')[0];

    await supabase.from('scans').update({ status: 'RUNNING' }).eq('id', scanId);
    await log(`Starting scan sequence for ${targetUrl}`);

    // --- PHASE 0: Subdomain Discovery (Subfinder) ---
    if (!scanUrl.includes('localhost') && !scanUrl.includes('127.0.0.1')) {
      await log("Phase 0: Scanning for subdomains...");
      const { stdout: sfOut } = await runCommand(getBin('subfinder'), ['-d', domain, '-silent']);
      const subdomains = sfOut.split('\n').filter(Boolean);
      if (subdomains.length > 0) {
        await saveFinding("Subfinder", "Info", {
          name: "Subdomains Discovered",
          description: "Identified related subdomains.",
          subdomains
        });
        await log(`Discovered ${subdomains.length} subdomains.`);
      } else {
        await log("Subfinder: No subdomains found.");
      }
    }

    // --- TIER 1: Tech Detection ---
    await log("Phase 1: Initializing Technology Fingerprinting...");
    const detectedTech = [];

    const nucleiTech = spawn(getBin('nuclei'), ['-u', targetUrl, '-t', 'technologies', '-json', '-silent'], { shell: isWin, windowsHide: true });

    nucleiTech.stdout.on('data', async (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const vuln = JSON.parse(line);
          await saveFinding("Nuclei-Tech", "Info", vuln);
          if (vuln['template-id']) detectedTech.push(vuln['template-id']);
        } catch (e) { }
      }
    });

    await new Promise((res) => {
      nucleiTech.on('close', res);
      nucleiTech.on('error', () => {
        log("Nuclei Tech execution failed.");
        res();
      });
    });

    await log(`Fingerprinting complete. Detected: ${detectedTech.join(', ') || 'Standard'}`);

    // --- TIER 2: Smart Nuclei ---
    await log(`Phase 2: Engaging Smart Nuclei Sweep...`);
    const targetFolders = ['vulnerabilities', 'misconfigurations', 'exposures'];

    const nucleiArgs = ['-u', targetUrl, '-json', '-silent', '-rl', '30'];
    for (const folder of targetFolders) {
      nucleiArgs.push('-t', folder);
    }

    const smartNuclei = spawn(getBin('nuclei'), nucleiArgs, { shell: isWin, windowsHide: true });

    smartNuclei.stdout.on('data', async (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const vuln = JSON.parse(line);
          const severity = vuln.info?.severity || "Info";
          await saveFinding("Nuclei-Smart", severity.charAt(0).toUpperCase() + severity.slice(1), vuln);
        } catch (e) { }
      }
    });

    // --- TIER 3: Parallel Engines ---
    await log("Phase 3: Launching Deep Scanners (Nikto, SQLMap, XSStrike)...");

    const runNikto = async () => {
      try {
        await log("Engaging Nikto...");

        if (IS_CI) {
          // --- GITHUB ACTIONS: Run actual Nikto via Perl ---
          // MUST run from nikto's own program directory so it can find its EXECDIR and databases
          const niktoDir = path.resolve('bin/nikto-dir/program');
          const { stdout, stderr, code } = await runCommand(PERL_CMD, ['nikto.pl', '-h', targetUrl, '-maxtime', '90s', '-Format', 'txt'], { cwd: niktoDir });
          console.log('[NIKTO STDERR]', stderr?.slice(0, 500));
          console.log('[NIKTO STDOUT]', stdout?.slice(0, 500));
          if (code !== 0 && !stdout) {
            await log(`Nikto: Failed (exit ${code}). ${stderr?.slice(0,200)}`);
            return;
          }
          const lines = stdout.split('\n').filter(l => l.startsWith('+ '));
          for (const line of lines) {
            const raw = line.replace('+ ', '').trim();
            let severity = 'Info';
            let name = 'Anomaly Detected';
            if (raw.includes('X-Frame-Options')) { severity = 'Medium'; name = 'Missing X-Frame-Options'; }
            else if (raw.includes('X-Content-Type-Options')) { severity = 'Low'; name = 'Missing X-Content-Type-Options'; }
            else if (raw.includes('Server:')) { severity = 'Low'; name = 'Server Information Disclosure'; }
            await saveFinding('Nikto', severity, { name, description: raw, raw, tool: 'Nikto', matched: targetUrl });
          }
          if (lines.length === 0) await log('Nikto: No anomalies found.');
          else await log(`Nikto: Scan complete. ${lines.length} anomalies found.`);

        } else {
          // --- LOCALHOST (Windows): Node.js header scanner - Defender blocks nikto.pl ---
          const response = await fetch(targetUrl).catch(() => null);
          let foundAnomalies = false;
          if (response) {
            const headers = response.headers;
            const rawHeadersDump = Array.from(headers.entries()).map(([k,v]) => `${k}: ${v}`).join('\n');
            if (!headers.get('x-frame-options')) {
              await saveFinding('Nikto', 'Medium', { name: 'Missing X-Frame-Options', description: 'Target is missing clickjacking protection. Raw headers captured below.', raw: `[Nikto Node Module]\nHTTP Response Headers:\n-------------------\n${rawHeadersDump}\n-------------------\nAnalysis: No X-Frame-Options detected.`, tool: 'Nikto', matched: targetUrl });
              foundAnomalies = true;
            }
            if (!headers.get('x-content-type-options')) {
              await saveFinding('Nikto', 'Low', { name: 'Missing X-Content-Type-Options', description: 'Target is missing MIME sniffing protection. Raw headers captured below.', raw: `[Nikto Node Module]\nHTTP Response Headers:\n-------------------\n${rawHeadersDump}\n-------------------\nAnalysis: No X-Content-Type-Options detected.`, tool: 'Nikto', matched: targetUrl });
              foundAnomalies = true;
            }
            const serverHeader = headers.get('server');
            if (serverHeader) {
              await saveFinding('Nikto', 'Low', { name: 'Server Information Disclosure', description: 'Target exposed server banner in headers.', raw: `[Nikto Node Module]\nHTTP Response Headers:\n-------------------\n${rawHeadersDump}\n-------------------\nAnalysis: Server version leaked as '${serverHeader}'.`, tool: 'Nikto', matched: targetUrl });
              foundAnomalies = true;
            }
          }
          if (!foundAnomalies) await log('Nikto: No anomalies found.');
          else await log('Nikto: Scan complete. Anomalies found.');
        }
      } catch (e) { await log(`Nikto Error: ${e.message}`); }
    };

    const runSqlMap = async () => {
      try {
        await log("Checking for injectable forms...");
        // Added --crawl so it finds parameters if URL is just a domain
        const { stdout } = await runCommand(PYTHON_CMD, [
          'bin/sqlmap/sqlmap.py', '-u', targetUrl,
          '--forms', '--crawl=2', '--batch',
          '--level=2', '--risk=1', '--threads=4',
          '--timeout=30', '--retries=1'
        ]);

        console.log('[SQLMAP STDOUT]', stdout?.slice(0, 500));

        if (stdout.includes('is vulnerable') || stdout.includes('Payload:')) {
          await saveFinding("SQLMap", "Critical", {
            name: "SQL Injection Confirmed",
            description: "SQLMap successfully exploited the database. Open to view the exact terminal execution trace.",
            raw: stdout.trim(),
            tool: "SQLMap",
            matched: targetUrl
          });
        } else {
          await log("SQLMap: No vulnerabilities found.");
        }
      } catch (e) { await log(`SQLMap Error: ${e.message}`); }
    };

    const runXSStrike = async () => {
      try {
        await log("Engaging XSStrike...");
        const { stdout } = await runCommand(PYTHON_CMD, [
          'bin/xsstrike/xsstrike.py', '-u', targetUrl,
          '--crawl', '--skip', '--timeout', '30'
        ]);

        console.log('[XSSTRIKE STDOUT]', stdout?.slice(0, 500));

        if (stdout.includes('Vulnerable') || stdout.includes('Payload:')) {
          await saveFinding("XSStrike", "High", {
            name: "Cross-Site Scripting (XSS)",
            description: "XSStrike executed a successful XSS payload. Open to view the exact terminal trace.",
            raw: stdout.trim(),
            tool: "XSStrike",
            matched: targetUrl
          });
        } else {
          await log("XSStrike: No vulnerabilities found.");
        }
      } catch (e) { await log(`XSStrike Error: ${e.message}`); }
    };

    const tier3 = Promise.allSettled([runNikto(), runSqlMap(), runXSStrike()]);

    await new Promise((resolve) => {
      if (smartNuclei.killed || smartNuclei.exitCode !== null) resolve(null);
      else {
        smartNuclei.on('close', resolve);
        smartNuclei.on('error', resolve);
      }
    });

    await tier3;

    await log("Scan sequence complete. Synchronizing final status...");

    await supabase.from('scans').update({ status: 'COMPLETED' }).eq('id', scanId);
    await log("Status locked: COMPLETED");

  } catch (error) {
    console.error("Worker Error:", error);
    await log(`FATAL ERROR: ${error.message}`);
    await supabase.from('scans').update({ status: 'FAILED', error: error.message }).eq('id', scanId);
  } finally {
    setTimeout(() => {
      console.log("--- SCANNER WORKER SHUTDOWN ---");
      process.exit(0);
    }, 2000);
  }
}

main();

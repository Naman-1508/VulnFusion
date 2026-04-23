import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const scanUrl = process.env.SCAN_URL;
const scanId = process.env.SCAN_ID;

console.log('--- SCANNER WORKER STARTING ---');
console.log('Target URL:', scanUrl);
console.log('Scan ID:', scanId);

if (!supabaseUrl || !supabaseKey || !scanUrl || !scanId) {
  console.error("Missing required environment variables:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    hasScanUrl: !!scanUrl,
    hasScanId: !!scanId
  });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

function runCommand(cmd, args) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on('data', (data) => {
      const line = data.toString();
      stdout += line;
      // If we are in nuclei, we handle JSON lines elsewhere, 
      // but for generic tools we can log progress
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
    const isDomain = !scanUrl.startsWith('http') || scanUrl.split('.').length > 1;
    let targetUrl = scanUrl.startsWith('http') ? scanUrl : `http://${scanUrl}`;

    await supabase.from('scans').update({ status: 'RUNNING' }).eq('id', scanId);
    await log(`Starting scan sequence for ${targetUrl}`);

    // --- PHASE 0: Subdomain Discovery (Subfinder) ---
    if (!scanUrl.includes('localhost') && !scanUrl.includes('127.0.0.1')) {
        await log("Phase 0: Scanning for subdomains...");
        const domain = targetUrl.replace('http://', '').replace('https://', '').split('/')[0];
        const { stdout: sfOut } = await runCommand('./bin/subfinder', ['-d', domain, '-silent']);
        const subdomains = sfOut.split('\n').filter(Boolean);
        if (subdomains.length > 0) {
            await saveFinding("Subfinder", "Info", { subdomains });
            await log(`Discovered ${subdomains.length} subdomains.`);
        }
    }

    // --- TIER 1: Tech Detection ---
    await log("Phase 1: Initializing Technology Fingerprinting...");
    const detectedTech = [];
    
    // Use local nuclei binary
    const nucleiTech = spawn('./bin/nuclei', ['-u', targetUrl, '-t', 'technologies/', '-json', '-silent']);
    
    nucleiTech.stdout.on('data', async (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const vuln = JSON.parse(line);
          await saveFinding("Nuclei-Tech", "Info", vuln);
          if (vuln['template-id']) detectedTech.push(vuln['template-id']);
        } catch (e) {}
      }
    });

    await new Promise((res) => nucleiTech.on('close', res));
    await log(`Fingerprinting complete. Detected: ${detectedTech.join(', ') || 'Standard'}`);

    // --- TIER 2: Smart Nuclei ---
    const techMap = {
      'wordpress': ['cms/wordpress/', 'cves/wordpress/'],
      'php': ['vulnerabilities/php/', 'exposures/configs/'],
      'nginx': ['misconfiguration/nginx/'],
      'apache': ['misconfiguration/apache/'],
      'jquery': ['cves/jquery/'],
      'drupal': ['cms/drupal/'],
      'joomla': ['cms/joomla/'],
      'laravel': ['vulnerabilities/laravel/'],
      'iis': ['misconfiguration/iis/'],
      'tomcat': ['misconfiguration/tomcat/'],
      'spring': ['vulnerabilities/spring/']
    };

    let targetFolders = [];
    detectedTech.forEach(tech => {
      const key = Object.keys(techMap).find(k => tech.toLowerCase().includes(k));
      if (key) targetFolders.push(...techMap[key]);
    });

    if (targetFolders.length === 0) {
      await log("No specific tech matches. Falling back to vulnerability baseline.");
      targetFolders = ['vulnerabilities/', 'misconfiguration/', 'exposures/'];
    }

    await log(`Phase 2: Engaging Smart Nuclei Sweep...`);
    
    const nucleiArgs = ['-u', targetUrl, '-json', '-silent', '-rl', '30'];
    if (targetFolders.length > 0) {
      nucleiArgs.push('-t', ...new Set(targetFolders));
    }

    const smartNuclei = spawn('./bin/nuclei', nucleiArgs);
    
    smartNuclei.stdout.on('data', async (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const vuln = JSON.parse(line);
            const severity = vuln.info?.severity || "Info";
            await saveFinding("Nuclei-Smart", severity.charAt(0).toUpperCase() + severity.slice(1), vuln);
          } catch (e) {}
        }
    });

    // --- TIER 3: Parallel Engines ---
    await log("Phase 3: Launching Deep Scanners (Nikto, SQLMap, XSStrike)...");

    const runNikto = async () => {
      try {
        await log("Engaging Nikto...");
        const { stdout } = await runCommand('perl', ['bin/nikto-dir/program/nikto.pl', '-h', targetUrl, '-maxtime', '120s']);
        
        // Nikto findings usually start with '+ '
        const lines = stdout.split('\n').filter(line => line.includes('+ '));
        
        for (const line of lines) {
          const raw = line.replace('+ ', '').trim();
          let classification = "Anomaly";
          let description = raw;
          let severity = "Info";

          if (raw.includes('X-Frame-Options')) {
            classification = "Missing Anti-Clickjacking Header";
            description = "The X-Frame-Options header is missing, which could allow an attacker to 'frame' this site and perform clickjacking attacks.";
            severity = "Medium";
          } else if (raw.includes('X-Content-Type-Options')) {
            classification = "Missing MIME Sniffing Protection";
            description = "The X-Content-Type-Options header is not set, allowing the browser to guess the content type which can lead to XSS.";
            severity = "Low";
          } else if (raw.includes('Server:')) {
            classification = "Server Information Disclosure";
            description = `The server revealed its version: ${raw.split('Server:')[1]?.trim()}. This helps attackers find specific exploits.`;
            severity = "Low";
          } else if (raw.includes('OSVDB')) {
            classification = "Known Vulnerability (OSVDB)";
            severity = "Medium";
          }

          await saveFinding("Nikto", severity, { 
            name: classification,
            description: description,
            raw: raw,
            tool: "Nikto"
          });
        }
        
        if (lines.length === 0) await log("Nikto: No anomalies found.");
      } catch (e) { await log(`Nikto Error: ${e.message}`); }
    };

    const runSqlMap = async () => {
      try {
        await log("Checking for injectable forms...");
        const { stdout } = await runCommand('python3', ['bin/sqlmap-dir/sqlmap.py', '-u', targetUrl, '--forms', '--batch', '--level=1', '--risk=1', '--random-agent']);
        
        if (stdout.includes('is vulnerable')) {
            await saveFinding("SQLMap", "Critical", { 
              name: "SQL Injection Detected",
              description: "SQLMap found a parameter or form that is vulnerable to SQL injection. An attacker could potentially steal or delete your entire database.",
              raw: "Target is vulnerable to SQL injection.",
              tool: "SQLMap"
            });
        } else {
            await log("SQLMap: No vulnerabilities found.");
        }
      } catch (e) { await log(`SQLMap Error: ${e.message}`); }
    };

    const runXSStrike = async () => {
      try {
        await log("Engaging XSStrike...");
        const { stdout } = await runCommand('python3', ['bin/xsstrike/xsstrike.py', '--url', targetUrl, '--skip', '--timeout', '30']);
        
        if (stdout.includes('Vulnerable')) {
            await saveFinding("XSStrike", "High", { 
              name: "Cross-Site Scripting (XSS)",
              description: "A potential XSS vulnerability was found. Attackers can inject malicious scripts into pages viewed by other users.",
              raw: "XSS Vulnerability confirmed by payload execution.",
              tool: "XSStrike"
            });
        } else {
            await log("XSStrike: No vulnerabilities found.");
        }
      } catch (e) { await log(`XSStrike Error: ${e.message}`); }
    };

    // Run Tier 3 while Tier 2 is running
    const tier3 = Promise.allSettled([runNikto(), runSqlMap(), runXSStrike()]);
    
    await new Promise((res) => smartNuclei.on('close', res));
    await tier3;

    await log("Scan sequence complete.");
    await supabase.from('scans').update({ status: 'COMPLETED' }).eq('id', scanId);
    
  } catch (error) {
    console.error("Worker Error:", error);
    await log(`FATAL ERROR: ${error.message}`);
    await supabase.from('scans').update({ status: 'FAILED', error: error.message }).eq('id', scanId);
  }
}

main();

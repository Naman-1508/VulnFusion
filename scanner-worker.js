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
    await supabase.from('scans').update({ status: 'RUNNING' }).eq('id', scanId);
    await log(`Starting scan sequence for ${scanUrl}`);

    // --- TIER 1: Tech Detection ---
    await log("Phase 1: Initializing Technology Fingerprinting...");
    const detectedTech = [];
    
    const nucleiTech = spawn('nuclei', ['-u', scanUrl, '-t', 'technologies/', '-json', '-silent']);
    
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
    await log(`Fingerprinting complete. Detected assets: ${detectedTech.join(', ') || 'Standard'}`);

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
      await log("No specific tech matches. Falling back to high-intensity baseline.");
      targetFolders = ['vulnerabilities/', 'misconfiguration/', 'exposures/', 'default-logins/'];
    }

    await log(`Phase 2: Engaging High-Intensity Nuclei Sweep...`);
    
    // Run with all default templates for maximum coverage
    const nucleiArgs = ['-u', scanUrl, '-json', '-silent', '-stats', '-rl', '50'];
    if (targetFolders.length > 0 && targetFolders[0] !== 'vulnerabilities/') {
      nucleiArgs.push('-t', ...new Set(targetFolders));
    }

    const smartNuclei = spawn('nuclei', nucleiArgs);
    
    smartNuclei.stderr.on('data', (data) => {
      console.log(`[NUCLEI SYSTEM]: ${data.toString()}`);
    });

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
    await log("Phase 3: Launching Parallel Depth Scanners (Nikto, SQLMap, XSStrike)...");

    const runNikto = async () => {
      try {
        await log("Engaging Nikto Engine...");
        const { stdout } = await runCommand('nikto', ['-h', scanUrl, '-maxtime', '300']);
        const findings = stdout.split('\n').filter(line => line.includes('+ '));
        for (const f of findings) {
            await saveFinding("Nikto", "Medium", { raw: f.trim() });
        }
        await log("Nikto assessment complete.");
      } catch (e) { await log(`Nikto Engine Error: ${e.message}`); }
    };

    const runSqlMap = async () => {
      try {
        await log("Checking for injectable forms...");
        const response = await fetch(scanUrl);
        const html = await response.text();
        if (html.includes('<form')) {
          await log("Forms detected. Engaging SQLMap...");
          const { stdout } = await runCommand('sqlmap', ['-u', scanUrl, '--forms', '--batch', '--level=1', '--risk=1', '--timeout=60']);
          if (stdout.includes('is vulnerable')) {
            await saveFinding("SQLMap", "Critical", { raw: stdout });
          }
        } else {
          await log("No forms detected. Skipping SQLMap.");
        }
        await log("SQLMap assessment complete.");
      } catch (e) { await log(`SQLMap Engine Error: ${e.message}`); }
    };

    const runXSStrike = async () => {
      try {
        await log("Engaging XSStrike Engine...");
        const { stdout } = await runCommand('python3', ['-m', 'xsstrike', '--url', scanUrl, '--skip', '--timeout', '60']);
        if (stdout.includes('Vulnerable')) {
            await saveFinding("XSStrike", "High", { raw: stdout });
        }
        await log("XSStrike assessment complete.");
      } catch (e) { await log(`XSStrike Engine Error: ${e.message}`); }
    };

    // Run Tier 3 while Tier 2 is running
    const tier3 = Promise.allSettled([runNikto(), runSqlMap(), runXSStrike()]);
    
    // Wait for everything to finish
    await new Promise((res) => smartNuclei.on('close', res));
    await tier3;

    await log("Scan sequence successfully synchronized. Updating central status.");
    await supabase.from('scans').update({ status: 'COMPLETED' }).eq('id', scanId);
    
  } catch (error) {
    console.error("Worker Error:", error);
    await log(`FATAL ERROR: ${error.message}`);
    await supabase.from('scans').update({ status: 'FAILED', error: error.message }).eq('id', scanId);
  }
}

main();

import { prisma } from "./prisma";
import { runSubfinder } from "./scanners/subfinder";
import { runNikto, VulnerabilityResult } from "./scanners/nikto";
import { runNuclei } from "./scanners/nuclei";
import { runSqlMap } from "./scanners/sqlmap";
import { runXSStrike } from "./scanners/xsstrike";

export async function runFullScan(targetUrl: string, existingScanId?: string) {
  // Use existing scan ID if provided, otherwise create a new scan record
  const scan = existingScanId
    ? await prisma.scan.update({ where: { id: existingScanId }, data: { status: "RUNNING", logs: "" } })
    : await prisma.scan.create({ data: { targetUrl, status: "RUNNING", logs: "" } });

  const logToDb = async (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${message}\n`;
    console.log(formatted.trim());
    await prisma.scan.update({
        where: { id: scan.id },
        data: { logs: { append: formatted } }
    }).catch(() => {}); // Ignore errors in logging
  };

  try {
    // Step 1: Subdomain Discovery
    await logToDb(`\x1b[35m[SYSTEM]\x1b[0m \x1b[1mPHASE 1:\x1b[0m Subdomain Discovery for ${targetUrl}`);
    const subdomains = await runSubfinder(targetUrl, logToDb);
    const uniqueSubdomains = Array.from(new Set(subdomains));
    await logToDb(`\x1b[35m[SYSTEM]\x1b[0m \x1b[32mDISCOVERY COMPLETE:\x1b[0m ${uniqueSubdomains.length} nodes identified.`);
    
    if (uniqueSubdomains.length > 0) {
      await prisma.subdomain.createMany({
        data: uniqueSubdomains.map(domain => ({ scanId: scan.id, domain })),
      }).catch(e => console.error("[\x1b[31mDATABASE ERROR\x1b[0m] Failed to sync nodes", e));
    }

    // Step 2: All scanners in parallel
    await logToDb(`\n\x1b[35m[SYSTEM]\x1b[0m \x1b[1mPHASE 2:\x1b[0m Multi-Vector Vulnerability Assessment`);
    await logToDb(`\x1b[35m[SYSTEM]\x1b[0m \x1b[90mEngaging Nikto, Nuclei, SQLMap, and XSStrike engines...\x1b[0m`);
    
    const [niktoResults, nucleiResults, sqlmapResults, xsstrikeResults] = await Promise.allSettled([
      runNikto(targetUrl, logToDb),
      runNuclei(targetUrl, logToDb),
      runSqlMap(targetUrl, logToDb),
      runXSStrike(targetUrl, logToDb),
    ]);

    const vulnerabilities: VulnerabilityResult[] = [];
    
    for (const result of [niktoResults, nucleiResults, sqlmapResults, xsstrikeResults]) {
      if (result.status === "fulfilled") {
        vulnerabilities.push(...result.value);
      } else {
        await logToDb(`\x1b[31m[ENGINE ERROR]\x1b[0m A core scanner failed: ${result.reason}`);
      }
    }

    await logToDb(`\n\x1b[35m[SYSTEM]\x1b[0m \x1b[32mANALYSIS COMPLETE:\x1b[0m ${vulnerabilities.length} threats cataloged.`);

    if (vulnerabilities.length > 0) {
      await prisma.vulnerability.createMany({
        data: vulnerabilities.map(v => ({
          scanId: scan.id,
          name: v.name,
          severity: v.severity,
          tool: v.tool,
          description: v.description,
          proof: v.proof ?? null,
        })),
      }).catch(e => console.error("[\x1b[31mDATABASE ERROR\x1b[0m] Failed to commit threat data", e));
    }

    await prisma.scan.update({ where: { id: scan.id }, data: { status: "COMPLETED" } });
    await logToDb(`\x1b[35m[SYSTEM]\x1b[0m \x1b[1m\x1b[32mSCAN ${scan.id} SYNCHRONIZED SUCCESSFULLY.\x1b[0m\n`);

    return scan.id;
  } catch (error: any) {
    await logToDb(`\n\x1b[31m[FATAL ERROR]\x1b[0m Scan sequence aborted: ${error.message}`);
    await prisma.scan.update({ where: { id: scan.id }, data: { status: "FAILED" } }).catch(() => {});
    throw error;
  }
}

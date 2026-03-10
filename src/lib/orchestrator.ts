import { prisma } from "./prisma";
import { runSubfinder } from "./scanners/subfinder";
import { runNikto, VulnerabilityResult } from "./scanners/nikto";
import { runNuclei } from "./scanners/nuclei";
import { runSqlMap } from "./scanners/sqlmap";
import { runXSStrike } from "./scanners/xsstrike";

export async function runFullScan(targetUrl: string, existingScanId?: string) {
  // Use existing scan ID if provided, otherwise create a new scan record
  const scan = existingScanId
    ? await prisma.scan.update({ where: { id: existingScanId }, data: { status: "RUNNING" } })
    : await prisma.scan.create({ data: { targetUrl, status: "RUNNING" } });

  try {
    // Step 1: Subdomain Discovery
    const subdomains = await runSubfinder(targetUrl);
    // Deduplicate subdomains manually for SQLite since skipDuplicates is not supported
    const uniqueSubdomains = Array.from(new Set(subdomains));
    
    if (uniqueSubdomains.length > 0) {
      await prisma.subdomain.createMany({
        data: uniqueSubdomains.map(domain => ({ scanId: scan.id, domain })),
      });
    }

    // Step 2: All scanners in parallel
    const [niktoResults, nucleiResults, sqlmapResults, xsstrikeResults] = await Promise.allSettled([
      runNikto(targetUrl),
      runNuclei(targetUrl),
      runSqlMap(targetUrl),
      runXSStrike(targetUrl),
    ]);

    const vulnerabilities: VulnerabilityResult[] = [];
    
    for (const result of [niktoResults, nucleiResults, sqlmapResults, xsstrikeResults]) {
      if (result.status === "fulfilled") {
        vulnerabilities.push(...result.value);
      } else {
        console.error("Scanner failed:", result.reason);
      }
    }

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
      });
    }

    await prisma.scan.update({ where: { id: scan.id }, data: { status: "COMPLETED" } });

    return scan.id;
  } catch (error) {
    console.error("Scan run failed:", error);
    await prisma.scan.update({ where: { id: scan.id }, data: { status: "FAILED" } });
    throw error;
  }
}

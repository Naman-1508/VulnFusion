import { runTool } from "../tools-path";
import { VulnerabilityResult } from "./nikto";

export async function runNuclei(targetUrl: string, log?: (msg: string) => Promise<void>): Promise<VulnerabilityResult[]> {
    const results: VulnerabilityResult[] = [];
    try {
        const { stdout } = await runTool("nuclei", ["-u", targetUrl, "-j"], log);
        const lines = stdout.split("\n").filter(Boolean);
        for (const line of lines) {
            try {
                const vuln = JSON.parse(line);
                results.push({
                    name: vuln.info?.name || "Nuclei Finding",
                    severity: vuln.info?.severity
                        ? vuln.info.severity.charAt(0).toUpperCase() + vuln.info.severity.slice(1)
                        : "Info",
                    tool: "Nuclei",
                    description: vuln.info?.description || vuln.template || "Vulnerability found via Nuclei template",
                    proof: vuln["matched-at"] || "",
                });
            } catch {
                // ignore malformed JSON lines
            }
        }
        return results;
    } catch (error) {
        console.warn("Nuclei execution failed.", error);
        return [];
    }
}

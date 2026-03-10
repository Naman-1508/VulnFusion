import { exec } from "child_process";
import util from "util";
import { VulnerabilityResult } from "./nikto";

const execPromise = util.promisify(exec);

export async function runNuclei(targetUrl: string): Promise<VulnerabilityResult[]> {
    const results: VulnerabilityResult[] = [];

    try {
        // Command: nuclei -u http://example.com -j
        const { stdout } = await execPromise(`nuclei -u ${targetUrl} -j`);

        const lines = stdout.split("\n").filter(Boolean);
        for (const line of lines) {
            try {
                const vuln = JSON.parse(line);
                results.push({
                    name: vuln.info?.name || "Nuclei Finding",
                    severity: vuln.info?.severity ? vuln.info.severity.charAt(0).toUpperCase() + vuln.info.severity.slice(1) : "Info",
                    tool: "Nuclei",
                    description: vuln.info?.description || vuln.template || "Vulnerability found via Nuclei template",
                    proof: vuln["matched-at"] || "",
                });
            } catch (e) {
                // ignore JSON parse error for a single line
            }
        }
        return results;
    } catch (error) {
        console.warn("Nuclei execution failed.", error);
        return [];
    }
}

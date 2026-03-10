import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export interface VulnerabilityResult {
    name: string;
    severity: string;
    tool: string;
    description: string;
    proof?: string;
}

export async function runNikto(targetUrl: string): Promise<VulnerabilityResult[]> {
    const results: VulnerabilityResult[] = [];
    try {
        // Command: nikto -h http://example.com -Format json
        const { stdout } = await execPromise(`nikto -h ${targetUrl} -Format json`);

        // Attempt to parse nikto json output
        const data = JSON.parse(stdout);

        if (data && data.vulnerabilities) {
            for (const vuln of data.vulnerabilities) {
                results.push({
                    name: "Web Server Misconfiguration",
                    severity: "Medium",
                    tool: "Nikto",
                    description: vuln.msg || "Issue found by Nikto",
                    proof: vuln.url,
                });
            }
        }
        return results;
    } catch (error) {
        console.warn("Nikto execution failed.", error);
        return [];
    }
}

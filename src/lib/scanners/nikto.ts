import { runTool } from "../tools-path";

export interface VulnerabilityResult {
    name: string;
    severity: string;
    tool: string;
    description: string;
    proof?: string;
}

export async function runNikto(targetUrl: string, log?: (msg: string) => Promise<void>): Promise<VulnerabilityResult[]> {
    const results: VulnerabilityResult[] = [];
    try {
        const { stdout } = await runTool("nikto", ["-h", targetUrl, "-Format", "json"], log);
        if (!stdout || !stdout.trim()) {
            console.log("[\x1b[33mNIKTO\x1b[0m] No output generated. Engine may be missing or target unreachable.");
            return [];
        }
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

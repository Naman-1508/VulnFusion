import { runTool } from "../tools-path";
import { VulnerabilityResult } from "./nikto";

export async function runXSStrike(targetUrl: string, log?: (msg: string) => Promise<void>): Promise<VulnerabilityResult[]> {
    try {
        const { stdout } = await runTool("xsstrike", ["-u", targetUrl, "--batch"], log);
        if (stdout.includes("Vulnerable")) {
            return [{
                name: "Cross-Site Scripting (XSS)",
                severity: "High",
                tool: "XSStrike",
                description: "XSS vulnerability detected in one of the URL parameters.",
                proof: targetUrl,
            }];
        }
        return [];
    } catch (error) {
        console.warn("XSStrike execution failed.", error);
        return [];
    }
}

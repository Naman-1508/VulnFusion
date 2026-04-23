import { runTool } from "../tools-path";
import { VulnerabilityResult } from "./nikto";

export async function runSqlMap(targetUrl: string, log?: (msg: string) => Promise<void>): Promise<VulnerabilityResult[]> {
    try {
        const { stdout } = await runTool("sqlmap", ["-u", targetUrl, "--batch"], log);
        if (stdout.includes("is vulnerable")) {
            return [{
                name: "SQL Injection",
                severity: "Critical",
                tool: "SQLMap",
                description: "A parameter appears injectable. SQLMap successfully detected a SQL Injection flaw.",
                proof: targetUrl,
            }];
        }
        return [];
    } catch (error) {
        console.warn("SQLMap execution failed.", error);
        return [];
    }
}

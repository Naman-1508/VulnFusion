import { exec } from "child_process";
import util from "util";
import { VulnerabilityResult } from "./nikto";

const execPromise = util.promisify(exec);

export async function runSqlMap(targetUrl: string): Promise<VulnerabilityResult[]> {
    try {
        // Command: sqlmap -u "http://example.com?id=1" --batch
        const { stdout } = await execPromise(`sqlmap -u "${targetUrl}" --batch`);

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

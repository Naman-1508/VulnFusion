import { exec } from "child_process";
import util from "util";
import { VulnerabilityResult } from "./nikto";

const execPromise = util.promisify(exec);

export async function runXSStrike(targetUrl: string): Promise<VulnerabilityResult[]> {
    try {
        // Command: python xsstrike.py -u "http://target" --batch
        const { stdout } = await execPromise(`python xsstrike.py -u "${targetUrl}" --batch`);

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

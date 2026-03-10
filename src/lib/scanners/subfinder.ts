import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export async function runSubfinder(targetUrl: string): Promise<string[]> {
    try {
        const domain = new URL(targetUrl).hostname;
        // Command: subfinder -d example.com -silent
        const { stdout } = await execPromise(`subfinder -d ${domain} -silent`);

        if (!stdout.trim()) return [];

        return stdout.split("\n").map(s => s.trim()).filter(Boolean);
    } catch (error) {
        console.warn("Subfinder execution failed.", error);
        return [];
    }
}

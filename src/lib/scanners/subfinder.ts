import { runTool } from "../tools-path";

export async function runSubfinder(targetUrl: string, log?: (msg: string) => Promise<void>): Promise<string[]> {
    try {
        let url = targetUrl;
        if (!url.startsWith("http")) url = "https://" + url;
        const domain = new URL(url).hostname;
        const { stdout } = await runTool("subfinder", ["-d", domain, "-silent"]);
        if (!stdout.trim()) return [];
        return stdout.split("\n").map(s => s.trim()).filter(Boolean);
    } catch (error) {
        console.warn("Subfinder execution failed.", error);
        return [];
    }
}

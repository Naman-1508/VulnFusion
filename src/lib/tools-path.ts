import path from "path";
import os from "os";
import fs from "fs";
import { spawn } from "child_process";

const isWindows = os.platform() === "win32";
const binDir = path.join(process.cwd(), "bin");

type Tool = "nuclei" | "subfinder" | "sqlmap" | "xsstrike" | "nikto";

export function getBinaryPath(tool: Tool): string[] {
  let parts: string[];
  switch (tool) {
    case "nuclei":
      parts = [path.join(binDir, isWindows ? "nuclei.exe" : "nuclei")];
      break;
    case "subfinder":
      parts = [path.join(binDir, isWindows ? "subfinder.exe" : "subfinder")];
      break;
    case "sqlmap":
      parts = [isWindows ? "python" : "python3", path.join(binDir, "sqlmap", "sqlmap.py")];
      break;
    case "xsstrike":
      parts = [isWindows ? "python" : "python3", path.join(binDir, "xsstrike", "xsstrike.py")];
      break;
    case "nikto":
      parts = ["perl", path.join(binDir, "nikto", "program", "nikto.pl")];
      break;
  }

  // Verify binary existence if it's a direct file path (not a python/perl command)
  if (parts.length === 1 && !fs.existsSync(parts[0])) {
    throw new Error(`Binary not found at ${parts[0]}`);
  }
  
  return parts;
}

/**
 * Runs a tool using spawn (avoids shell quoting issues on Windows).
 * Returns { stdout, stderr }
 */
export function runTool(tool: Tool, args: string[], log?: (msg: string) => Promise<void>): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const timestamp = () => new Date().toLocaleTimeString();
    let parts: string[];
    
    try {
      parts = getBinaryPath(tool);
    } catch (e: any) {
      const msg = `\x1b[33mSKIPPED\x1b[0m \x1b[1m${tool}\x1b[0m: Dependency missing (${e.message})`;
      if (log) log(msg);
      else console.log(`[\x1b[33m${timestamp()}\x1b[0m] ${msg}`);
      return resolve({ stdout: "", stderr: e.message });
    }
    
    const cmd = parts[0];
    const cmdArgs = [...parts.slice(1), ...args];

    const initMsg = `\x1b[34mINITIATING\x1b[0m \x1b[1m${tool.toUpperCase()}\x1b[0m ...`;
    const cmdMsg = `\x1b[90mCommand: ${cmd} ${cmdArgs.join(" ")}\x1b[0m`;
    
    if (log) { log(initMsg); log(cmdMsg); }
    else { console.log(`[\x1b[36m${timestamp()}\x1b[0m] ${initMsg}`); console.log(`[\x1b[36m${timestamp()}\x1b[0m] ${cmdMsg}`); }

    const proc = spawn(cmd, cmdArgs, {
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    // Set a much longer timeout (60 minutes) as requested
    const timeout = setTimeout(() => {
        const timeoutMsg = `\x1b[31mTIMEOUT\x1b[0m: \x1b[1m${tool}\x1b[0m aborted after 60m`;
        if (log) log(timeoutMsg);
        else console.log(`[\x1b[31m${timestamp()}\x1b[0m] ${timeoutMsg}`);
        proc.kill();
    }, 60 * 60 * 1000);

    proc.stdout?.on("data", (d) => { stdout += d.toString(); });
    proc.stderr?.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0 && stdout === "") {
        const failMsg = `\x1b[31mFAILED\x1b[0m \x1b[1m${tool}\x1b[0m (Code ${code})`;
        if (log) log(failMsg);
        else console.log(`[\x1b[31m${timestamp()}\x1b[0m] ${failMsg}`);
        resolve({ stdout: "", stderr });
      } else {
        const successMsg = `\x1b[32mSUCCESS\x1b[0m \x1b[1m${tool}\x1b[0m task completed.`;
        if (log) log(successMsg);
        else console.log(`[\x1b[32m${timestamp()}\x1b[0m] ${successMsg}`);
        resolve({ stdout, stderr });
      }
    });

    proc.on("error", (err) => {
        clearTimeout(timeout);
        const errorMsg = `\x1b[31mERROR\x1b[0m \x1b[1m${tool}\x1b[0m: ${err.message}`;
        if (log) log(errorMsg);
        else console.log(`[\x1b[31m${timestamp()}\x1b[0m] ${errorMsg}`);
        resolve({ stdout: "", stderr: err.message });
    });
  });
}

import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Force dynamic - this route is never statically rendered
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body.targetUrl || body.url;
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: "Missing or invalid URL" }, { status: 400 });
    }
    
    try { new URL(url.startsWith('http') ? url : `http://${url}`); } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase Admin not configured" }, { status: 500 });
    }
    
    // Create the scan record in Supabase
    const { data: scan, error: dbError } = await supabaseAdmin
      .from('scans')
      .insert([{ url: url, status: 'PENDING' }])
      .select()
      .single();

    if (dbError) {
      console.error("Supabase Error:", dbError);
      return NextResponse.json({ error: "Failed to create scan record" }, { status: 500 });
    }
    
    const isVercel = process.env.VERCEL === '1';

    if (isVercel) {
      // ─── PRODUCTION (Vercel) ───────────────────────────────────────────────
      // Vercel is serverless — we cannot spawn background processes.
      // Trigger the GitHub Actions workflow instead, which has all the tools.
      const githubToken = process.env.GITHUB_TOKEN;
      const githubRepo = process.env.GITHUB_REPO; // e.g. "Naman-1508/VulnFusion"

      if (!githubToken || !githubRepo) {
        console.error("GITHUB_TOKEN or GITHUB_REPO env vars not set for production scan dispatch.");
        return NextResponse.json({ 
          error: "Scanner not configured for production. Set GITHUB_TOKEN and GITHUB_REPO in Vercel env vars." 
        }, { status: 500 });
      }

      const ghResponse = await fetch(
        `https://api.github.com/repos/${githubRepo}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'run-scan',
            client_payload: { url, scan_id: scan.id }
          })
        }
      );

      if (!ghResponse.ok) {
        const errText = await ghResponse.text();
        console.error("GitHub Actions dispatch failed:", errText);
        return NextResponse.json({ error: "Failed to dispatch scanner via GitHub Actions" }, { status: 500 });
      }

      console.log(`GitHub Actions scan dispatched for scan ID: ${scan.id}`);

    } else {
      // ─── LOCALHOST (Development) ───────────────────────────────────────────
      // Dynamically import child_process so Turbopack never sees it at build time.
      const { spawn } = await import('child_process');
      const { join } = await import('path');

      const workerPath = join(process.cwd(), process.env.WORKER_SCRIPT_NAME as string);
      console.log(`Spawning local scanner worker for scan ID: ${scan.id}`);

      const workerProcess = spawn('node', [workerPath], {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          SCAN_URL: url,
          SCAN_ID: scan.id,
          SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      });
      workerProcess.unref();
    }

    return NextResponse.json({ id: scan.id, scanId: scan.id, message: "Scan dispatched" }, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/scan error:", error);
    return NextResponse.json({ error: error.message || "Failed to start scan" }, { status: 500 });
  }
}

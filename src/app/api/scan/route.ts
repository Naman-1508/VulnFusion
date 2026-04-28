import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Force dynamic rendering - this route makes external API calls
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
    
    // 1. Create the scan record in Supabase
    const { data: scan, error: dbError } = await supabaseAdmin
      .from('scans')
      .insert([{ url: url, status: 'PENDING' }])
      .select()
      .single();

    if (dbError) {
      console.error("Supabase Error:", dbError);
      return NextResponse.json({ error: "Failed to create scan record" }, { status: 500 });
    }
    
    // 2. Dispatch scanner via GitHub Actions repository_dispatch
    // This works for BOTH local development and production (Vercel).
    // On Vercel: serverless functions cannot spawn background processes.
    // On localhost: GitHub Actions provides a clean Linux environment with all tools installed.
    const githubToken = process.env.GITHUB_PAT;
    const repoOwner = process.env.GITHUB_REPO_OWNER;
    const repoName = process.env.GITHUB_REPO_NAME;

    if (!githubToken || !repoOwner || !repoName) {
      console.error("GITHUB_PAT, GITHUB_REPO_OWNER or GITHUB_REPO_NAME not configured.");
      return NextResponse.json({ 
        error: "Scanner not configured. Set GITHUB_PAT, GITHUB_REPO_OWNER and GITHUB_REPO_NAME environment variables." 
      }, { status: 500 });
    }

    const ghResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`,
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
      console.error("GitHub Actions dispatch failed:", ghResponse.status, errText);
      return NextResponse.json({ error: "Failed to dispatch scanner" }, { status: 500 });
    }

    console.log(`GitHub Actions scan dispatched for scan ID: ${scan.id}, URL: ${url}`);
    return NextResponse.json({ id: scan.id, scanId: scan.id, message: "Scan dispatched via GitHub Actions" }, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/scan error:", error);
    return NextResponse.json({ error: error.message || "Failed to start scan" }, { status: 500 });
  }
}

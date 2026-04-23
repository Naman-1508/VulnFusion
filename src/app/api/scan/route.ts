import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Support both 'targetUrl' and 'url' for compatibility
    const url = body.targetUrl || body.url;
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: "Missing or invalid URL" }, { status: 400 });
    }
    
    // Validate URL format
    try { new URL(url); } catch {
      return NextResponse.json({ error: "Invalid URL format. Please include http:// or https://" }, { status: 400 });
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
    
    // 2. Dispatch GitHub Action
    const GITHUB_PAT = process.env.GITHUB_PAT;
    const OWNER = process.env.GITHUB_REPO_OWNER;
    const REPO = process.env.GITHUB_REPO_NAME;

    if (!GITHUB_PAT || !OWNER || !REPO) {
        console.error("GitHub configuration missing in environment variables");
        await supabaseAdmin.from('scans').update({ status: 'FAILED', error: 'System configuration error (GitHub)' }).eq('id', scan.id);
        return NextResponse.json({ error: "Scanner deployment configuration missing" }, { status: 500 });
    }

    const dispatchResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'run-scan',
        client_payload: {
          url: url,
          scan_id: scan.id
        }
      })
    });

    if (!dispatchResponse.ok) {
        const errorText = await dispatchResponse.text();
        console.error("GitHub Dispatch failed:", errorText);
        await supabaseAdmin.from('scans').update({ status: 'FAILED', error: 'Failed to trigger scanning engine' }).eq('id', scan.id);
        return NextResponse.json({ error: "Failed to initiate scanning engine" }, { status: 500 });
    }

    return NextResponse.json({ id: scan.id, scanId: scan.id, message: "Scan dispatched" }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/scan error:", error);
    return NextResponse.json({ error: error.message || "Failed to start scan" }, { status: 500 });
  }
}

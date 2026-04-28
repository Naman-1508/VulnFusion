import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { spawn } from 'child_process';
import path from 'path';

// Force dynamic rendering - this route spawns background processes and must not be statically analyzed
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Support both 'targetUrl' and 'url' for compatibility
    const url = body.targetUrl || body.url;
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: "Missing or invalid URL" }, { status: 400 });
    }
    
    // Validate URL format
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
    
    // 2. Dispatch Local Scanner Worker
    // IMPORTANT: Path is built dynamically to prevent Turbopack from statically
    // analyzing and attempting to bundle scanner-worker.js as a module at build time.
    console.log(`Starting local scanner worker for scan ID: ${scan.id}`);
    const workerFileName = ['scanner', 'worker.js'].join('-');
    const workerPath = path.join(process.cwd(), workerFileName);
    
    const workerProcess = spawn('node', [workerPath], {
      detached: true,
      stdio: 'ignore', // We ignore stdio so it can run completely in the background
      env: {
        ...process.env,
        SCAN_URL: url,
        SCAN_ID: scan.id,
        // Make sure it has access to the Supabase keys
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });

    // Unref the child process so the parent (Next.js server) doesn't wait for it to exit
    workerProcess.unref();

    return NextResponse.json({ id: scan.id, scanId: scan.id, message: "Local scan dispatched" }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/scan error:", error);
    return NextResponse.json({ error: error.message || "Failed to start scan" }, { status: 500 });
  }
}

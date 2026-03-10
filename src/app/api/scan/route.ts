import { NextResponse, NextRequest } from 'next/server';
import { runFullScan } from '@/lib/orchestrator';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUrl } = body;
    
    if (!targetUrl || typeof targetUrl !== 'string') {
      return NextResponse.json({ error: "Missing or invalid targetUrl" }, { status: 400 });
    }
    
    // Validate URL format
    try { new URL(targetUrl); } catch {
      return NextResponse.json({ error: "Invalid URL format. Please include http:// or https://" }, { status: 400 });
    }
    
    // Create the scan record immediately so user can see it
    const scan = await prisma.scan.create({
      data: { targetUrl, status: "PENDING" }
    });
    
    // Fire scan in background (no await)
    setImmediate(async () => {
      try {
        await runFullScan(targetUrl, scan.id);
      } catch (e) {
        console.error("Background scan failed", e);
        await prisma.scan.update({ where: { id: scan.id }, data: { status: "FAILED" } });
      }
    });
    
    return NextResponse.json({ scanId: scan.id, message: "Scan started" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/scan error:", error);
    return NextResponse.json({ error: "Failed to start scan" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const scans = await prisma.scan.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(scans);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 });
    }
}

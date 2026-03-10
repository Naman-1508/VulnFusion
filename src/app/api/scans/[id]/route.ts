import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Next.js 15: params is a Promise and must be awaited
        const { id } = await params;

        const scan = await prisma.scan.findUnique({
            where: { id },
            include: {
                subdomains: true,
                vulnerabilities: true,
            }
        });

        if (!scan) {
            return NextResponse.json({ error: "Scan not found" }, { status: 404 });
        }

        return NextResponse.json(scan);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch scan details" }, { status: 500 });
    }
}

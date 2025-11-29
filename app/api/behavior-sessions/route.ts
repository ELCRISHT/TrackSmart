import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = (callId: string) => path.join(DATA_DIR, `session-${callId}.json`);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { callId, entries, startedAt, endedAt } = body as {
      callId: string;
      entries: { userId: string; timeline: { status: string; at: number }[] }[];
      startedAt?: number;
      endedAt?: number;
    };

    if (!callId || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE(callId), JSON.stringify({ callId, entries, startedAt, endedAt }, null, 2), 'utf-8');

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

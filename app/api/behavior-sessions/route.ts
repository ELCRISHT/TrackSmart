import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const FILE = (callId: string) => `behavior-sessions/${callId}.json`;

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

    const data = JSON.stringify({ callId, entries, startedAt, endedAt }, null, 2);
    
    await put(FILE(callId), data, {
      access: 'public',
      contentType: 'application/json',
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

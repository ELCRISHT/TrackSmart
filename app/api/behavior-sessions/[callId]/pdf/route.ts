import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export const runtime = 'nodejs';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = (callId: string) => path.join(DATA_DIR, `session-${callId}.json`);

export async function GET(req: NextRequest, { params }: { params: { callId: string } }) {
  const { callId } = params;
  const file = FILE(callId);

  try {
    const raw = await fs.readFile(file, 'utf-8');
    const data = JSON.parse(raw) as {
      callId: string;
      entries: { userId: string; timeline: { status: string; at: number }[] }[];
      startedAt?: number;
      endedAt?: number;
    };

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const chunks: Buffer[] = [];
    const done: Promise<Uint8Array> = new Promise((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      doc.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve(new Uint8Array(buf));
      });
      doc.on('error', (err) => reject(err));
    });

    doc.fontSize(18).text(`Class Behavior Analytics - ${new Date(data.endedAt || Date.now()).toLocaleString()}`);
    doc.moveDown();

    data.entries.forEach((s) => {
      doc.fontSize(14).text(`Student: ${s.userId}`);
      doc.moveDown(0.3);
      doc.fontSize(10);
      s.timeline.forEach((e, idx) => {
        doc.text(`${idx + 1}. ${e.status} - ${new Date(e.at).toLocaleTimeString()}`);
      });
      doc.moveDown();
    });

    doc.end();

    const body = await done;
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="behavior-${callId}.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Not found' }, { status: 404 });
  }
}

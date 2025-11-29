import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
      notes?: string;
    };

    // Create a very simple one-page PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Title
    const title = `Class Behavior Report`;
    page.drawText(title, { x: margin, y, size: 18, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
    y -= 24;

    // Subheader
    const sub = `Call ID: ${data.callId}`;
    page.drawText(sub, { x: margin, y, size: 10, font });
    y -= 14;

    const when = `Generated: ${new Date(data.endedAt || Date.now()).toLocaleString()}`;
    page.drawText(when, { x: margin, y, size: 10, font });
    y -= 16;

    if (data.startedAt) {
      page.drawText(`Started: ${new Date(data.startedAt).toLocaleString()}`, { x: margin, y, size: 10, font });
      y -= 14;
    }
    if (data.endedAt) {
      page.drawText(`Ended: ${new Date(data.endedAt).toLocaleString()}`, { x: margin, y, size: 10, font });
      y -= 16;
    }

    // Notes (wrapped)
    if (data.notes) {
      y = drawWrapped(page, `Notes: ${data.notes}`, { x: margin, y, size: 10, font, maxChars: 90, lineGap: 12 });
      y -= 8;
    }

    // Divider
    page.drawText('Students', { x: margin, y, size: 12, font: fontBold });
    y -= 16;

    // Per-student one-liners; limit to fit single page
    const MAX_LINES = 30; // keep simple to avoid multipage complexity
    let lines = 0;
    for (const s of data.entries) {
      if (lines >= MAX_LINES || y < margin + 14) break;

      const avg = averageScore(s.timeline);
      const distracted = s.timeline.filter((e) => e.status === 'Distracted').length;
      const attentiveRate = percent(
        s.timeline.filter((e) => e.status === 'Attentive').length,
        s.timeline.length,
      );
      const line = `${s.userId}  |  Avg: ${avg}  |  Attentive: ${attentiveRate}%  |  Distracted: ${distracted}`;
      page.drawText(line, { x: margin, y, size: 10, font });
      y -= 12;
      lines++;
    }

    const bytes = await pdfDoc.save();
    const body = Buffer.from(bytes);
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

function averageScore(timeline: { status: string; at: number }[]): number {
  if (!timeline?.length) return 0;
  const map: Record<string, number> = { Attentive: 100, Distracted: 50, Inattentive: 25, Away: 0 };
  const vals = timeline.map((e) => map[e.status] ?? 0);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function percent(n: number, d: number): number {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function drawWrapped(
  page: any,
  text: string,
  opts: { x: number; y: number; size: number; font: any; maxChars: number; lineGap?: number },
): number {
  const { x, y, size, font, maxChars, lineGap = 12 } = opts;
  const lines = wrapText(text, maxChars).split('\n');
  let yy = y;
  for (const ln of lines) {
    page.drawText(ln, { x, y: yy, size, font });
    yy -= lineGap;
    if (yy < 60) break; // safety to avoid overflow
  }
  return yy;
}

function wrapText(text: string, cols: number): string {
  if (!text) return '';
  const words = text.split(/\s+/);
  let line = '';
  const lines: string[] = [];
  for (const w of words) {
    if ((line + ' ' + w).trim().length > cols) {
      lines.push(line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join('\n');
}

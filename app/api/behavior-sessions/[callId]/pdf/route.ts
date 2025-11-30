import { NextRequest, NextResponse } from 'next/server';
import { head } from '@vercel/blob';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const runtime = 'nodejs';

const FILE = (callId: string) => `behavior-sessions/${callId}.json`;

export async function GET(req: NextRequest, { params }: { params: Promise<{ callId: string }> | { callId: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const { callId } = resolvedParams;

  try {
    const blobInfo = await head(FILE(callId));
    const response = await fetch(blobInfo.url);
    const raw = await response.text();
    const data = JSON.parse(raw) as {
      callId: string;
      entries: { userId: string; timeline: { status: string; at: number }[] }[];
      startedAt?: number;
      endedAt?: number;
      notes?: string;
    };

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText(`Class Behavior Report`, {
      x: margin,
      y,
      size: 18,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.15),
    });
    y -= 24;

    page.drawText(`Call ID: ${data.callId}`, { x: margin, y, size: 10, font });
    y -= 14;

    const when = `Generated: ${new Date(data.endedAt || Date.now()).toLocaleString()}`;
    page.drawText(when, { x: margin, y, size: 10, font });
    y -= 16;

    if (data.startedAt) {
      page.drawText(`Started: ${new Date(data.startedAt).toLocaleString()}`, {
        x: margin,
        y,
        size: 10,
        font,
      });
      y -= 14;
    }

    if (data.endedAt) {
      page.drawText(`Ended: ${new Date(data.endedAt).toLocaleString()}`, {
        x: margin,
        y,
        size: 10,
        font,
      });
      y -= 16;
    }

    if (data.notes) {
      y = drawWrapped(page, `Notes: ${data.notes}`, {
        x: margin,
        y,
        size: 10,
        font,
        maxChars: 90,
        lineGap: 12,
      });
      y -= 8;
    }

    page.drawText('Students', {
      x: margin,
      y,
      size: 12,
      font: fontBold,
    });
    y -= 16;

    const MAX_LINES = 30;
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

    // Produce PDF bytes
    const bytes = await pdfDoc.save(); // Uint8Array

    // Create a new ArrayBuffer from the Uint8Array to ensure proper type
    const arrayBuffer = new ArrayBuffer(bytes.length);
    const view = new Uint8Array(arrayBuffer);
    view.set(bytes);

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="behavior-${callId}.pdf"`,
        'Content-Length': String(bytes.byteLength),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Not found' }, { status: 404 });
  }
}

function averageScore(timeline: { status: string; at: number }[]): number {
  if (!timeline?.length) return 0;
  const map: Record<string, number> = {
    Attentive: 100,
    Distracted: 50,
    Inattentive: 25,
    Away: 0,
  };
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
    if (yy < 60) break;
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

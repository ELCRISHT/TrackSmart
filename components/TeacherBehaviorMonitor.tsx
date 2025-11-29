"use client";
import { useEffect, useMemo, useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Button } from './ui/button';

export type BehaviorStatus = 'Attentive' | 'Distracted' | 'Away' | 'Inattentive';

type Entry = { status: BehaviorStatus; at: number };

type StudentStats = {
  userId: string;
  timeline: Entry[]; // ordered by time
};

function statusColor(s: BehaviorStatus) {
  switch (s) {
    case 'Attentive':
      return 'bg-emerald-500';
    case 'Distracted':
      return 'bg-amber-500';
    case 'Away':
      return 'bg-gray-500';
    case 'Inattentive':
      return 'bg-red-500';
  }
}

export default function TeacherBehaviorMonitor() {
  const call = useCall();
  const { useLocalParticipant, useRemoteParticipants } = useCallStateHooks();
  const local = useLocalParticipant();
  const remotes = useRemoteParticipants();

  const [stats, setStats] = useState<Record<string, StudentStats>>({});

  const isTeacher = useMemo(() => {
    // Treat meeting owner as teacher/admin
    const createdById = call?.state.createdBy?.id;
    return !!(local && createdById && local.userId === createdById);
  }, [call?.state.createdBy?.id, local]);

  // Ingest custom events (safely typed)
  useEffect(() => {
    if (!call) return;
    const unsub = call.on('custom', (ev) => {
      const e: any = ev as any;
      const type: string | undefined = e?.customType ?? e?.type;
      if (type !== 'behavior-status') return;
      const data = (e?.data ?? {}) as Partial<{ userId: string; status: BehaviorStatus; at: number }>;
      const userId = data.userId;
      const status = data.status;
      const at = data.at;
      if (!userId || !status || !at) return;

      setStats((prev) => {
        const cur = prev[userId] ?? { userId, timeline: [] };
        const nextTimeline = [...cur.timeline, { status, at }].sort((a, b) => a.at - b.at);
        return { ...prev, [userId]: { userId, timeline: nextTimeline } };
      });
    });

    return () => unsub?.();
  }, [call]);

  // Export to PDF using window.print with a dedicated printable area.
  const onExportPdf = () => {
    // Create a new window for printing to keep main UI clean
    const w = window.open('', 'print');
    if (!w) return;
    const style = `
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 24px; }
        h1 { font-size: 20px; margin-bottom: 12px; }
        h2 { font-size: 16px; margin: 16px 0 8px; }
        .row { display: flex; align-items: center; margin: 6px 0; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; color: #fff; font-size: 12px; margin-right: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; }
      </style>
    `;

    const now = new Date();

    const html = [`<h1>Class Behavior Analytics - ${now.toLocaleString()}</h1>`];

    Object.values(stats).forEach((s) => {
      html.push(`<h2>Student: ${s.userId}</h2>`);
      html.push('<table><thead><tr><th>#</th><th>Status</th><th>Time</th></tr></thead><tbody>');
      s.timeline.forEach((e, idx) => {
        html.push(`<tr><td>${idx + 1}</td><td>${e.status}</td><td>${new Date(e.at).toLocaleTimeString()}</td></tr>`);
      });
      html.push('</tbody></table>');
    });

    w.document.write(style + html.join(''));
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  if (!isTeacher) return null;

  // Map current status by taking last timeline entry
  const current: Record<string, BehaviorStatus> = {};
  Object.keys(stats).forEach((uid) => {
    const t = stats[uid]?.timeline;
    if (t && t.length) current[uid] = t[t.length - 1].status;
  });

  const onSaveToServer = async () => {
    try {
      const callId = call?.id;
      if (!callId) return;
      const payload = {
        callId,
        entries: Object.values(stats).map((s) => ({ userId: s.userId, timeline: s.timeline })),
        endedAt: Date.now(),
      };
      await fetch('/api/behavior-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert('Saved to server');
    } catch (e) {
      alert('Failed to save');
    }
  };

  const onDownloadServerPdf = async () => {
    const callId = call?.id;
    if (!callId) return;
    const res = await fetch(`/api/behavior-sessions/${callId}/pdf`);
    if (!res.ok) {
      alert('PDF not ready');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `behavior-${callId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute right-4 top-4 z-50 w-96 rounded-lg bg-dark-1/90 p-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Behavior Monitor (Teacher)</div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onExportPdf}>Print PDF</Button>
          <Button size="sm" variant="secondary" onClick={onSaveToServer}>Save</Button>
          <Button size="sm" variant="secondary" onClick={onDownloadServerPdf}>Download</Button>
        </div>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {remotes.map((p) => {
          const s = current[p.userId] ?? 'Attentive';
          return (
            <div key={p.userId} className="flex items-center justify-between rounded-md bg-dark-2 p-2">
              <div className="text-xs font-medium truncate mr-2">{p.userId}</div>
              <div className={`text-[11px] px-2 py-0.5 rounded-full text-white ${statusColor(s)}`}>{s}</div>
            </div>
          );
        })}
        {remotes.length === 0 && (
          <div className="text-xs text-gray-400">No remote students connected yet.</div>
        )}
      </div>
    </div>
  );
}

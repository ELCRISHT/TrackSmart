"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
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
    const createdById = call?.state.createdBy?.id;
    return !!(local && createdById && local.userId === createdById);
  }, [call?.state.createdBy?.id, local]);

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

  // Metrics
  const studentCount = remotes.length;
  const latestByUser: Record<string, BehaviorStatus> = {};
  Object.keys(stats).forEach((uid) => {
    const t = stats[uid]?.timeline;
    if (t && t.length) latestByUser[uid] = t[t.length - 1].status;
  });
  const attentiveCount = Object.values(latestByUser).filter((s) => s === 'Attentive').length;
  const attentionRate = studentCount > 0 ? Math.round((attentiveCount / studentCount) * 100) : 0;

  // Simple score: Attentive=100, Distracted=50, Inattentive=25, Away=0; average across students.
  const scoreMap: Record<BehaviorStatus, number> = { Attentive: 100, Distracted: 50, Inattentive: 25, Away: 0 };
  const scores = Object.values(latestByUser).map((s) => scoreMap[s]);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Distractions: count of 'Distracted' events across all students (last 5 minutes)
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const distractions = Object.values(stats).reduce((acc, s) => acc + s.timeline.filter((e) => e.status === 'Distracted' && e.at >= fiveMinAgo).length, 0);

  // Handlers
  const onExportPdf = () => {
    const w = window.open('', 'print');
    if (!w) return;
    const style = `
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 24px; }
        h1 { font-size: 20px; margin-bottom: 12px; }
        h2 { font-size: 16px; margin: 16px 0 8px; }
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

  // Draggable position (teacher-only)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const draggingRef = useRef(false);
  const offsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  useEffect(() => {
    const callId = call?.id;
    if (!callId) return;
    try {
      const raw = localStorage.getItem(`tbm-pos-${callId}`);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.x === 'number' && typeof p?.y === 'number') setPos(p);
      }
    } catch {}
  }, [call?.id]);

  useEffect(() => {
    const callId = call?.id;
    if (!callId) return;
    try {
      localStorage.setItem(`tbm-pos-${callId}`, JSON.stringify(pos));
    } catch {}
  }, [pos, call?.id]);

  const startDrag = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    draggingRef.current = true;
    offsetRef.current = { dx: clientX - rect.left, dy: clientY - rect.top };
  };

  // eslint-disable-next-line no-undef
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  // eslint-disable-next-line no-undef
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    startDrag(t.clientX, t.clientY);
  };

  useEffect(() => {
    const onMove = (clientX: number, clientY: number) => {
      if (!draggingRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      let x = clientX - offsetRef.current.dx;
      let y = clientY - offsetRef.current.dy;
      x = Math.max(8, Math.min(vw - width - 8, x));
      y = Math.max(8, Math.min(vh - height - 8, y));
      setPos({ x, y });
    };

    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    };
    const end = () => {
      draggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchend', end);
    };
  }, []);

  if (!isTeacher) return null;

  return (
    <div ref={containerRef} className="absolute z-50 w-[28rem] rounded-2xl bg-[#0e1621]/95 p-4 shadow-xl ring-1 ring-white/10" style={{ left: pos.x, top: pos.y, touchAction: 'none' }}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between cursor-move select-none" onMouseDown={onMouseDown} onTouchStart={onTouchStart} onDragStart={(e) => e.preventDefault()}>
        <div className="flex items-center gap-2 text-[15px] font-semibold">
          <span>Student Attention Monitor</span>
        </div>
        <div className="rounded-full bg-[#1b2a3a] px-3 py-1 text-xs font-medium text-white/80">
          {studentCount} Students
        </div>
      </div>

      {/* Summary metrics */}
      <div className="mb-3 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[#0b1220] p-3 ring-1 ring-white/5">
          <div className="text-[11px] text-white/60">Attention Rate</div>
          <div className="mt-1 text-xl font-bold text-emerald-400">{attentionRate}%</div>
        </div>
        <div className="rounded-lg bg-[#0b1220] p-3 ring-1 ring-white/5">
          <div className="text-[11px] text-white/60">Avg Score</div>
          <div className="mt-1 text-xl font-bold text-amber-300">{avgScore}</div>
        </div>
        <div className="rounded-lg bg-[#0b1220] p-3 ring-1 ring-white/5">
          <div className="text-[11px] text-white/60">Distractions</div>
          <div className="mt-1 text-xl font-bold text-red-400">{distractions}</div>
        </div>
      </div>

      {/* Participants list */}
      <div className="mb-3 max-h-60 space-y-2 overflow-y-auto pr-1">
        {remotes.map((p) => {
          const s = latestByUser[p.userId] ?? 'Attentive';
          return (
            <div key={p.userId} className="flex items-center justify-between rounded-md bg-[#0b1220] p-2 ring-1 ring-white/5">
              <div className="flex items-center gap-2">
                <span className={`inline-block size-2 rounded-full ${s === 'Attentive' ? 'bg-emerald-400' : s === 'Distracted' ? 'bg-amber-400' : s === 'Inattentive' ? 'bg-red-400' : 'bg-gray-400'}`} />
                <div className="text-xs font-medium truncate max-w-[10rem]">{p.userId}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-white/70">{s}</div>
                <div className={`text-[11px] px-2 py-0.5 rounded-full text-white ${statusColor(s)}`}></div>
              </div>
            </div>
          );
        })}
        {remotes.length === 0 && (
          <div className="text-xs text-gray-400">No remote students connected yet.</div>
        )}
      </div>

      {/* Actions */}
      <div className="mb-2 flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={onDownloadServerPdf}>Download Report</Button>
        <Button size="sm" variant="secondary" onClick={onSaveToServer}>Save</Button>
        <Button size="sm" variant="secondary" onClick={onExportPdf}>Print</Button>
      </div>

      {/* Legend */}
      <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-white/70">
        <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400" /> Attentive</div>
        <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-400" /> Distracted</div>
        <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-red-400" /> Inattentive</div>
        <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-gray-400" /> Away</div>
      </div>
    </div>
  );
}

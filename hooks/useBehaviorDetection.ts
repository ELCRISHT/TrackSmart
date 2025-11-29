import { useEffect, useMemo, useRef, useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

export type BehaviorStatus = 'Attentive' | 'Distracted' | 'Away' | 'Inattentive';

export type BehaviorSnapshot = {
  status: BehaviorStatus;
  at: number; // epoch ms
};

export type BehaviorThresholds = {
  awaySeconds: number; // consider away after no camera OR no presence for N seconds
  distractedSeconds: number; // tab hidden or frequent focus loss for N seconds
  inattentiveSeconds: number; // no user activity for N seconds while present
  activityResetMs: number; // reset activity timer on mouse/keyboard every X ms debounce window
};

const DEFAULT_THRESHOLDS: BehaviorThresholds = {
  awaySeconds: 20,
  distractedSeconds: 10,
  inattentiveSeconds: 30,
  activityResetMs: 400,
};

// Lightweight, privacy-preserving behavior detector without ML: uses
// - camera/audio enabled status from Stream call
// - Page Visibility API (tab hidden/background)
// - user activity (mouse/keyboard)
// Emits custom events to the call for aggregation.
export type BehaviorMode = 'light' | 'mediapipe';

export function useBehaviorDetection(
  opts?: Partial<BehaviorThresholds> & { mode?: BehaviorMode },
) {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(opts || {}) };
  const mode: BehaviorMode = opts?.mode ?? 'light';
  const STABILIZE_MS = 2500; // require this dwell time before switching visible status

  const call = useCall();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const [status, setStatus] = useState<BehaviorStatus>('Attentive');
  const [lastChangeAt, setLastChangeAt] = useState<number>(Date.now());
  const candidateStatusRef = useRef<BehaviorStatus>('Attentive');
  const candidateSinceRef = useRef<number>(Date.now());

  const lastActivityRef = useRef<number>(Date.now());
  const lastVisibilityHiddenRef = useRef<number | null>(null);
  const prevVisibilityStateRef = useRef<DocumentVisibilityState | null>(null);

  const emitBehaviorEvent = useMemo(() => {
    return async (snapshot: BehaviorSnapshot) => {
      // Fire-and-forget custom event so teacher can aggregate
      try {
        if (!call) return;
        await call.sendCustomEvent({
          type: 'behavior-status',
          data: {
            userId: localParticipant?.userId,
            status: snapshot.status,
            at: snapshot.at,
          },
        });
      } catch (_) {
        // no-op
      }
    };
  }, [call, localParticipant?.userId]);

  // Track page visibility (tab focus)
  useEffect(() => {
    const onVisibility = () => {
      const now = Date.now();
      if (document.visibilityState === 'hidden') {
        lastVisibilityHiddenRef.current = now;
      } else {
        lastVisibilityHiddenRef.current = null;
      }
      prevVisibilityStateRef.current = document.visibilityState;
    };

    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Track user activity
  useEffect(() => {
    let lastEmit = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastEmit > thresholds.activityResetMs) {
        lastActivityRef.current = now;
        lastEmit = now;
      }
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onActivity));
  }, [thresholds.activityResetMs]);

  // Media state is read during tick loops; no subscription API used.

  // Core state machine
  useEffect(() => {
    let timer = 0 as any;
    let running = true;
    let videoEl: HTMLVideoElement | null = null;

    const commitIfStable = (next: BehaviorStatus, now: number) => {
      if (next !== candidateStatusRef.current) {
        candidateStatusRef.current = next;
        candidateSinceRef.current = now;
        return;
      }
      if (now - candidateSinceRef.current >= STABILIZE_MS && next !== status) {
        setStatus(next);
        setLastChangeAt(now);
        emitBehaviorEvent({ status: next, at: now });
      }
    };

    const lightTick = () => {
      const now = Date.now();

      const isHiddenLong =
        lastVisibilityHiddenRef.current != null &&
        now - lastVisibilityHiddenRef.current > thresholds.awaySeconds * 1000;
      const isCameraOff = !call || call.camera.state !== 'enabled';
      const isDistracted =
        lastVisibilityHiddenRef.current != null &&
        now - lastVisibilityHiddenRef.current > thresholds.distractedSeconds * 1000;
      const noActivityLong = now - lastActivityRef.current > thresholds.inattentiveSeconds * 1000;

      let next: BehaviorStatus = 'Attentive';
      if (isHiddenLong || isCameraOff) next = 'Away';
      else if (noActivityLong) next = 'Inattentive';
      else if (isDistracted) next = 'Distracted';

      commitIfStable(next, now);

      if (!running) return;
      timer = window.setTimeout(lightTick, 1000);
    };

    const mpLoop = async () => {
      const { detectFaceAndGaze } = await import('@/lib/mediapipe');
      const ts = Date.now();
      const now = ts;

      // Try to find a local video element from Stream SDK (self video). This is heuristic; fallback to light if not found.
      if (!videoEl) {
        videoEl = document.querySelector('video');
      }

      const isHidden = document.visibilityState === 'hidden';
      let next: BehaviorStatus = status;

      if (!videoEl || isHidden) {
        // fallback state when no video or tab hidden
        const isHiddenLong =
          lastVisibilityHiddenRef.current != null &&
          now - lastVisibilityHiddenRef.current > thresholds.awaySeconds * 1000;
        const noActivityLong = now - lastActivityRef.current > thresholds.inattentiveSeconds * 1000;
        if (isHiddenLong) next = 'Away';
        else if (noActivityLong) next = 'Inattentive';
        else next = 'Distracted';
      } else {
        try {
          const r = await detectFaceAndGaze(videoEl, ts);
          if (!r.hasFace) next = 'Away';
          else if (r.gazeDeviation > 0.35) next = 'Distracted';
          else next = 'Attentive';
        } catch {
          // If MediaPipe fails, fall back to light heuristics for this iteration
          const isHiddenLong =
            lastVisibilityHiddenRef.current != null &&
            now - lastVisibilityHiddenRef.current > thresholds.awaySeconds * 1000;
          const isCameraOff = !call || call.camera.state !== 'enabled';
          const isDistracted =
            lastVisibilityHiddenRef.current != null &&
            now - lastVisibilityHiddenRef.current > thresholds.distractedSeconds * 1000;
          const noActivityLong = now - lastActivityRef.current > thresholds.inattentiveSeconds * 1000;
          next = 'Attentive';
          if (isHiddenLong || isCameraOff) next = 'Away';
          else if (noActivityLong) next = 'Inattentive';
          else if (isDistracted) next = 'Distracted';
        }
      }

      commitIfStable(next, now);

      if (!running) return;
      timer = window.setTimeout(mpLoop, 750); // ~1.3Hz
    };

    if (mode === 'mediapipe') mpLoop();
    else lightTick();

    return () => {
      running = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [emitBehaviorEvent, mode, status, thresholds.awaySeconds, thresholds.distractedSeconds, thresholds.inattentiveSeconds]);

  return {
    status,
    lastChangeAt,
  } as const;
}

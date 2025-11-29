// Lazy-loading MediaPipe Tasks Vision FaceLandmarker and a small detector wrapper.
import type { FaceLandmarker } from '@mediapipe/tasks-vision';

let _resolverPromise: Promise<any> | null = null;
let _faceLandmarkerPromise: Promise<FaceLandmarker> | null = null;

export type MPFaceResult = {
  hasFace: boolean;
  gazeDeviation: number; // 0..1 where higher is more off-center
};

export async function ensureFaceLandmarker() {
  if (!_resolverPromise) {
    _resolverPromise = (async () => {
      const vision = await import('@mediapipe/tasks-vision');
      const resolver = await vision.FilesetResolver.forVisionTasks(
        // Use CDN; alternatively host locally
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );
      return resolver;
    })();
  }
  if (!_faceLandmarkerPromise) {
    _faceLandmarkerPromise = (async () => {
      const vision = await import('@mediapipe/tasks-vision');
      const resolver = await _resolverPromise!;
      const landmarker = await vision.FaceLandmarker.createFromOptions(resolver as any, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
      return landmarker;
    })();
  }
  return _faceLandmarkerPromise;
}

// Simple heuristic using a subset of landmarks: use nose tip (index 1 typically) and eye positions to estimate if user looks away.
// Since index mapping can vary, we'll fallback to center-of-mass heuristic from all landmarks.
export function computeGazeDeviationFromLandmarks(landmarks: { x: number; y: number; z?: number }[]): number {
  if (!landmarks.length) return 1;
  let cx = 0;
  let cy = 0;
  for (const p of landmarks) {
    cx += p.x;
    cy += p.y;
  }
  cx /= landmarks.length;
  cy /= landmarks.length;
  // deviation from center of frame (0.5, 0.5)
  const dx = Math.abs(cx - 0.5);
  const dy = Math.abs(cy - 0.5);
  const dev = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
  return dev;
}

export async function detectFaceAndGaze(
  video: HTMLVideoElement,
  tsMs: number,
): Promise<MPFaceResult> {
  const faceLandmarker = await ensureFaceLandmarker();
  const res = faceLandmarker.detectForVideo(video, tsMs);
  const faces = res.faceLandmarks ?? [];
  if (!faces.length) return { hasFace: false, gazeDeviation: 1 };
  const lm = faces[0];
  const gazeDeviation = computeGazeDeviationFromLandmarks(lm as any);
  return { hasFace: true, gazeDeviation };
}

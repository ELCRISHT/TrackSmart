'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export type BehaviorStatus = 'normal' | 'distracted' | 'out-of-frame';

interface MotionDetectionResult {
  status: BehaviorStatus;
  confidence: number;
  timestamp: number;
}

interface UseMotionDetectionOptions {
  enabled: boolean;
  videoElement?: HTMLVideoElement | null;
  sensitivity?: number; // 0-1, lower = more sensitive
  onStatusChange?: (status: BehaviorStatus) => void;
}

export const useMotionDetection = ({
  enabled,
  videoElement,
  sensitivity = 0.3,
  onStatusChange,
}: UseMotionDetectionOptions) => {
  const [result, setResult] = useState<MotionDetectionResult>({
    status: 'normal',
    confidence: 1,
    timestamp: Date.now(),
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastStatusRef = useRef<BehaviorStatus>('normal');

  const analyzeFrame = useCallback(() => {
    if (!videoElement || !enabled || videoElement.readyState < 2) {
      return;
    }

    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = videoElement.videoWidth || 640;
      canvasRef.current.height = videoElement.videoHeight || 480;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return;

    // Update canvas size if video size changed
    if (
      canvas.width !== videoElement.videoWidth ||
      canvas.height !== videoElement.videoHeight
    ) {
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
    }

    // Draw current frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Check if student is in frame (simple brightness check)
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const brightness = calculateBrightness(currentFrame);

    // If frame is too dark or too bright, student might be out of frame
    const isOutOfFrame = brightness < 0.1 || brightness > 0.9;

    if (isOutOfFrame) {
      const newResult: MotionDetectionResult = {
        status: 'out-of-frame',
        confidence: 0.8,
        timestamp: Date.now(),
      };
      setResult(newResult);

      if (lastStatusRef.current !== 'out-of-frame' && onStatusChange) {
        onStatusChange('out-of-frame');
      }
      lastStatusRef.current = 'out-of-frame';
      return;
    }

    // Compare with previous frame for motion detection
    if (previousFrameRef.current) {
      const motion = detectMotion(
        previousFrameRef.current,
        currentFrame,
        sensitivity
      );

      const status: BehaviorStatus = motion > sensitivity ? 'normal' : 'distracted';
      const confidence = Math.abs(motion);

      const newResult: MotionDetectionResult = {
        status,
        confidence,
        timestamp: Date.now(),
      };

      setResult(newResult);

      if (lastStatusRef.current !== status && onStatusChange) {
        onStatusChange(status);
      }
      lastStatusRef.current = status;
    }

    // Store current frame for next comparison
    previousFrameRef.current = currentFrame;
  }, [videoElement, enabled, sensitivity, onStatusChange]);

  useEffect(() => {
    if (!enabled || !videoElement) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const processFrame = () => {
      analyzeFrame();
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enabled, videoElement, analyzeFrame]);

  return result;
};

// Helper function to calculate average brightness
const calculateBrightness = (imageData: ImageData): number => {
  const data = imageData.data;
  let sum = 0;
  let count = 0;

  // Sample every 10th pixel for performance
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Calculate brightness using luminance formula
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    sum += brightness;
    count++;
  }

  return count > 0 ? sum / count : 0;
};

// Helper function to detect motion between frames
const detectMotion = (
  previous: ImageData,
  current: ImageData,
  threshold: number
): number => {
  if (
    previous.width !== current.width ||
    previous.height !== current.height
  ) {
    return 1; // Assume motion if dimensions changed
  }

  const prevData = previous.data;
  const currData = current.data;
  let diffSum = 0;
  let sampleCount = 0;

  // Sample every 20th pixel for performance
  for (let i = 0; i < prevData.length; i += 80) {
    const prevR = prevData[i];
    const prevG = prevData[i + 1];
    const prevB = prevData[i + 2];

    const currR = currData[i];
    const currG = currData[i + 1];
    const currB = currData[i + 2];

    // Calculate color difference
    const diff =
      Math.abs(prevR - currR) +
      Math.abs(prevG - currG) +
      Math.abs(prevB - currB);
    diffSum += diff;
    sampleCount++;
  }

  // Normalize to 0-1 range (0 = no motion, 1 = high motion)
  const avgDiff = diffSum / (sampleCount * 3 * 255);
  return avgDiff;
};


'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface DistractionAlertProps {
  duration: number; // in seconds
  reason: 'motion' | 'tab-switch' | 'out-of-frame';
  onDismiss?: () => void;
}

const DistractionAlert = ({
  duration,
  reason,
  onDismiss,
}: DistractionAlertProps) => {
  const [soundPlayed, setSoundPlayed] = useState(false);

  useEffect(() => {
    // Play alert sound
    if (!soundPlayed) {
      try {
        // Try to play audio file if it exists
        const audio = new Audio('/sounds/alert.mp3');
        audio.play().catch(() => {
          // Fallback: use Web Audio API to generate a beep
          generateBeep();
        });
      } catch {
        // Fallback: use Web Audio API to generate a beep
        generateBeep();
      }
      setSoundPlayed(true);
    }
  }, [soundPlayed]);

  const generateBeep = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play alert sound:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getReasonText = (): string => {
    switch (reason) {
      case 'motion':
        return 'Low activity detected';
      case 'tab-switch':
        return 'Non-educational tab detected';
      case 'out-of-frame':
        return 'You are out of frame';
      default:
        return 'Distraction detected';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
      <Card className="border-red-500 bg-red-900/90 text-white shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Attention Required</h3>
              <p className="text-xs text-red-100 mb-2">{getReasonText()}</p>
              <p className="text-xs font-medium">
                Distracted for: <span className="font-bold">{formatDuration(duration)}</span>
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-red-200 hover:text-white transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DistractionAlert;


'use client';

import { useEffect, useRef, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { useMotionDetection, BehaviorStatus } from '@/hooks/useMotionDetection';
import { useTabSwitching } from '@/hooks/useTabSwitching';
import { useDistractionTimer } from '@/hooks/useDistractionTimer';
import DistractionAlert from './DistractionAlert';
import { useUser } from '@clerk/nextjs';
import { useStudentStatusBroadcast } from '@/hooks/useStudentStatusBroadcast';

interface DistractionMonitorProps {
  onStatusUpdate?: (status: BehaviorStatus, isDistracted: boolean, duration: number) => void;
  onPermanentRecord?: (record: {
    startTime: number;
    endTime?: number;
    duration: number;
    reason: 'motion' | 'tab-switch' | 'out-of-frame';
    isPermanent: boolean;
  }) => void;
  enabled?: boolean;
}

const DistractionMonitor = ({
  onStatusUpdate,
  onPermanentRecord,
  enabled = true,
}: DistractionMonitorProps) => {
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const { user } = useUser();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertDuration, setAlertDuration] = useState(0);
  const [alertReason, setAlertReason] = useState<
    'motion' | 'tab-switch' | 'out-of-frame'
  >('motion');

  // Get video element from Stream SDK
  useEffect(() => {
    if (!enabled) return;

    const findVideoElement = () => {
      // Try multiple selectors to find the video element
      const videoElement =
        document.querySelector('video') ||
        document.querySelector('[data-testid="video-preview"] video') ||
        document.querySelector('.str-video__video video') ||
        null;

      if (videoElement && videoElement instanceof HTMLVideoElement) {
        videoRef.current = videoElement;
      }
    };

    // Try immediately
    findVideoElement();

    // Also try after a delay to ensure video is loaded
    const timeout = setTimeout(findVideoElement, 1000);

    // Watch for video elements being added to DOM
    const observer = new MutationObserver(() => {
      findVideoElement();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [localParticipant, enabled]);

  // Motion detection using pure heuristics (frame difference, brightness analysis)
  const motionResult = useMotionDetection({
    enabled: enabled,
    videoElement: videoRef.current || undefined,
    sensitivity: 0.3,
    onStatusChange: (status) => {
      if (status !== 'normal') {
        handleDistractionStart('motion');
      } else {
        handleDistractionStop();
      }
    },
  });

  // Tab switching detection
  const tabInfo = useTabSwitching(enabled);

  useEffect(() => {
    if (tabInfo.status === 'switched' && !tabInfo.isEducational) {
      handleDistractionStart('tab-switch');
    } else if (tabInfo.status === 'focused' && motionResult.status === 'normal') {
      handleDistractionStop();
    }
  }, [tabInfo, motionResult.status]);

  // Handle out-of-frame detection
  useEffect(() => {
    if (motionResult.status === 'out-of-frame') {
      handleDistractionStart('out-of-frame');
    } else if (
      motionResult.status === 'normal' &&
      tabInfo.status === 'focused'
    ) {
      handleDistractionStop();
    }
  }, [motionResult.status, tabInfo.status]);

  // Distraction timer
  const {
    isDistracted,
    currentDuration,
    hasAlerted,
    startDistraction,
    stopDistraction,
  } = useDistractionTimer({
    enabled,
    distractionThreshold: 30, // 30 seconds for permanent record
    alertThreshold: 10, // 10 seconds for alert
    onPermanentRecord: (record) => {
      if (onPermanentRecord) {
        onPermanentRecord({
          ...record,
        });
      }
    },
    onAlert: (duration) => {
      setShowAlert(true);
      setAlertDuration(duration);
      setAlertReason(
        motionResult.status === 'out-of-frame'
          ? 'out-of-frame'
          : tabInfo.status === 'switched' && !tabInfo.isEducational
          ? 'tab-switch'
          : 'motion'
      );
    },
  });

  const handleDistractionStart = (
    reason: 'motion' | 'tab-switch' | 'out-of-frame'
  ) => {
    if (!isDistracted) {
      startDistraction(reason);
    }
  };

  const handleDistractionStop = () => {
    if (isDistracted) {
      stopDistraction();
      setShowAlert(false);
    }
  };

  // Update parent component
  useEffect(() => {
    if (onStatusUpdate) {
      const isDistractedState =
        motionResult.status !== 'normal' ||
        (tabInfo.status === 'switched' && !tabInfo.isEducational);
      onStatusUpdate(motionResult.status, isDistractedState, currentDuration);
    }
  }, [motionResult.status, tabInfo, currentDuration, isDistracted, onStatusUpdate]);

  // Broadcast status to teacher (via Stream custom events)
  useStudentStatusBroadcast(
    motionResult.status,
    isDistracted,
    currentDuration,
    false // hasPermanentRecord - this would need to be tracked separately
  );

  if (!enabled) return null;

  return (
    <>
      {showAlert && hasAlerted && (
        <DistractionAlert
          duration={alertDuration}
          reason={alertReason}
          onDismiss={() => setShowAlert(false)}
        />
      )}
    </>
  );
};

export default DistractionMonitor;


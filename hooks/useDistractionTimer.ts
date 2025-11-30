'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { BehaviorStatus } from './useMotionDetection';

interface DistractionRecord {
  startTime: number;
  endTime?: number;
  duration: number; // in seconds
  reason: 'motion' | 'tab-switch' | 'out-of-frame';
  isPermanent: boolean;
}

interface UseDistractionTimerOptions {
  enabled: boolean;
  distractionThreshold: number; // seconds before permanent record
  alertThreshold: number; // seconds before showing alert
  onPermanentRecord?: (record: DistractionRecord) => void;
  onAlert?: (duration: number) => void;
}

export const useDistractionTimer = ({
  enabled,
  distractionThreshold = 30, // 30 seconds
  alertThreshold = 10, // 10 seconds
  onPermanentRecord,
  onAlert,
}: UseDistractionTimerOptions) => {
  const [isDistracted, setIsDistracted] = useState(false);
  const [distractionStart, setDistractionStart] = useState<number | null>(null);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [hasAlerted, setHasAlerted] = useState(false);
  const [hasPermanentRecord, setHasPermanentRecord] = useState(false);
  const [currentReason, setCurrentReason] = useState<
    'motion' | 'tab-switch' | 'out-of-frame'
  >('motion');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertShownRef = useRef(false);
  const permanentRecordCreatedRef = useRef(false);

  const startDistraction = useCallback(
    (reason: 'motion' | 'tab-switch' | 'out-of-frame') => {
      if (!isDistracted) {
        setIsDistracted(true);
        setDistractionStart(Date.now());
        setCurrentReason(reason);
        setHasAlerted(false);
        setHasPermanentRecord(false);
        alertShownRef.current = false;
        permanentRecordCreatedRef.current = false;
      }
    },
    [isDistracted]
  );

  const stopDistraction = useCallback(() => {
    if (isDistracted && distractionStart) {
      const duration = Math.floor((Date.now() - distractionStart) / 1000);
      setIsDistracted(false);
      setDistractionStart(null);
      setCurrentDuration(0);
      setHasAlerted(false);
      setHasPermanentRecord(false);
      alertShownRef.current = false;
      permanentRecordCreatedRef.current = false;

      // Create record if duration was significant
      if (duration >= 5 && onPermanentRecord) {
        onPermanentRecord({
          startTime: distractionStart,
          endTime: Date.now(),
          duration,
          reason: currentReason,
          isPermanent: duration >= distractionThreshold,
        });
      }
    }
  }, [isDistracted, distractionStart, currentReason, distractionThreshold, onPermanentRecord]);

  useEffect(() => {
    if (!enabled || !isDistracted || !distractionStart) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - distractionStart) / 1000);
      setCurrentDuration(duration);

      // Show alert after alertThreshold
      if (duration >= alertThreshold && !alertShownRef.current && onAlert) {
        alertShownRef.current = true;
        setHasAlerted(true);
        onAlert(duration);
      }

      // Create permanent record after distractionThreshold
      if (
        duration >= distractionThreshold &&
        !permanentRecordCreatedRef.current &&
        onPermanentRecord
      ) {
        permanentRecordCreatedRef.current = true;
        setHasPermanentRecord(true);
        onPermanentRecord({
          startTime: distractionStart,
          duration,
          reason: currentReason,
          isPermanent: true,
        });
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    enabled,
    isDistracted,
    distractionStart,
    alertThreshold,
    distractionThreshold,
    currentReason,
    onAlert,
    onPermanentRecord,
  ]);

  return {
    isDistracted,
    currentDuration,
    hasAlerted,
    hasPermanentRecord,
    startDistraction,
    stopDistraction,
  };
};


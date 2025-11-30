'use client';

import { useEffect } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { BehaviorStatus } from './useMotionDetection';

interface StudentStatusData {
  studentId: string;
  studentName: string;
  status: BehaviorStatus;
  isDistracted: boolean;
  distractionDuration: number;
  hasPermanentRecord: boolean;
}

export const useStudentStatusBroadcast = (
  status: BehaviorStatus,
  isDistracted: boolean,
  duration: number,
  hasPermanentRecord: boolean
) => {
  const call = useCall();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  useEffect(() => {
    if (!call || !localParticipant?.localParticipant) return;

    const user = localParticipant.localParticipant.userId;
    const userName = localParticipant.localParticipant.name || user;

    // Broadcast status using custom event
    const statusData: StudentStatusData = {
      studentId: user,
      studentName: userName,
      status,
      isDistracted,
      distractionDuration: duration,
      hasPermanentRecord,
    };

    // Use Stream's participant update to share status
    // Note: This uses participant custom data. In production, you might want to use
    // Stream's reaction system, custom events, or a backend service for more reliable status sharing
    try {
      // Update participant with custom data containing status
      call.updateUserPermissions({
        user_id: user,
        custom: {
          distractionStatus: JSON.stringify(statusData),
        },
      }).catch(() => {
        // Fallback: Store in local storage for cross-tab communication
        // This is a workaround if Stream API doesn't support the above
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            `student-status-${user}`,
            JSON.stringify({ ...statusData, timestamp: Date.now() })
          );
        }
      });
    } catch (error) {
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `student-status-${user}`,
          JSON.stringify({ ...statusData, timestamp: Date.now() })
        );
      }
    }
  }, [call, localParticipant, status, isDistracted, duration, hasPermanentRecord]);
};

export const useStudentStatusListener = (
  onStatusUpdate: (status: StudentStatusData) => void
) => {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  useEffect(() => {
    if (!call) return;

    // Listen to participant updates
    const handleParticipantUpdate = () => {
      participants.forEach((participant) => {
        if (participant.custom?.distractionStatus) {
          try {
            const statusData = JSON.parse(
              participant.custom.distractionStatus as string
            ) as StudentStatusData;
            onStatusUpdate(statusData);
          } catch (error) {
            console.error('Failed to parse distraction status:', error);
          }
        }
      });
    };

    // Also check localStorage as fallback
    const checkLocalStorage = () => {
      if (typeof window === 'undefined') return;
      
      participants.forEach((participant) => {
        const stored = localStorage.getItem(
          `student-status-${participant.userId}`
        );
        if (stored) {
          try {
            const statusData = JSON.parse(stored) as StudentStatusData & {
              timestamp: number;
            };
            // Only use if recent (within last 5 seconds)
            if (Date.now() - statusData.timestamp < 5000) {
              onStatusUpdate(statusData);
            }
          } catch (error) {
            // Ignore parse errors
          }
        }
      });
    };

    handleParticipantUpdate();
    checkLocalStorage();

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      handleParticipantUpdate();
      checkLocalStorage();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [call, participants, onStatusUpdate]);
};


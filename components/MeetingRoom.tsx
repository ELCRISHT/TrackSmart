'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, LayoutList } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Loader from './Loader';
import EndCallButton from './EndCallButton';
import DistractionMonitor from './DistractionMonitor';
import TeacherMonitor from './TeacherMonitor';
import { cn } from '@/lib/utils';
import { BehaviorStatus } from '@/hooks/useMotionDetection';
import { createDistractionRecord } from '@/actions/distraction.actions';
import { useStudentStatusListener } from '@/hooks/useStudentStatusBroadcast';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const { user } = useUser();
  const call = useCall();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  // for more detail about types of CallingState see: https://getstream.io/video/docs/react/ui-cookbook/ringing-call/#incoming-call-panel
  const callingState = useCallCallingState();

  // Determine if user is teacher (host/creator of the call)
  const isTeacher = call?.state.createdBy?.id === user?.id;

  // Student status tracking for teacher monitor
  const [studentStatuses, setStudentStatuses] = useState<
    Array<{
      studentId: string;
      studentName: string;
      status: BehaviorStatus;
      isDistracted: boolean;
      distractionDuration: number;
      lastUpdate: number;
      hasPermanentRecord: boolean;
    }>
  >([]);

  // Handle status updates from distraction monitor
  const handleStatusUpdate = useCallback(
    (status: BehaviorStatus, isDistracted: boolean, duration: number) => {
      if (!user) return;

      // Update student statuses for teacher monitor
      if (isTeacher) {
        setStudentStatuses((prev) => {
          const existing = prev.find((s) => s.studentId === user.id);
          if (existing) {
            return prev.map((s) =>
              s.studentId === user.id
                ? {
                    ...s,
                    status,
                    isDistracted,
                    distractionDuration: duration,
                    lastUpdate: Date.now(),
                  }
                : s
            );
          } else {
            return [
              ...prev,
              {
                studentId: user.id,
                studentName: user.username || user.firstName || user.id,
                status,
                isDistracted,
                distractionDuration: duration,
                lastUpdate: Date.now(),
                hasPermanentRecord: false,
              },
            ];
          }
        });
      }
    },
    [user, isTeacher]
  );

  // Handle permanent record creation
  const handlePermanentRecord = useCallback(
    async (record: {
      startTime: number;
      endTime?: number;
      duration: number;
      reason: 'motion' | 'tab-switch' | 'out-of-frame';
      isPermanent: boolean;
    }) => {
      if (!call || !user) return;

      try {
        await createDistractionRecord({
          meetingId: call.id,
          ...record,
        });

        // Update student status to show permanent record
        if (isTeacher) {
          setStudentStatuses((prev) =>
            prev.map((s) =>
              s.studentId === user.id
                ? { ...s, hasPermanentRecord: true }
                : s
            )
          );
        }
      } catch (error) {
        console.error('Failed to create distraction record:', error);
      }
    },
    [call, user, isTeacher]
  );

  // Listen for student status updates from custom events
  useStudentStatusListener(
    useCallback(
      (statusData) => {
        if (!isTeacher) return;

        setStudentStatuses((prev) => {
          const existing = prev.find(
            (s) => s.studentId === statusData.studentId
          );
          if (existing) {
            return prev.map((s) =>
              s.studentId === statusData.studentId
                ? {
                    ...s,
                    status: statusData.status,
                    isDistracted: statusData.isDistracted,
                    distractionDuration: statusData.distractionDuration,
                    hasPermanentRecord: statusData.hasPermanentRecord,
                    lastUpdate: Date.now(),
                  }
                : s
            );
          } else {
            return [
              ...prev,
              {
                studentId: statusData.studentId,
                studentName: statusData.studentName,
                status: statusData.status,
                isDistracted: statusData.isDistracted,
                distractionDuration: statusData.distractionDuration,
                hasPermanentRecord: statusData.hasPermanentRecord,
                lastUpdate: Date.now(),
              },
            ];
          }
        });
      },
      [isTeacher]
    )
  );

  // Initialize student statuses from participants
  useEffect(() => {
    if (!isTeacher || !participants) return;

    const newStatuses = participants
      .filter((p) => p.userId !== user?.id) // Exclude self
      .map((participant) => {
        const existing = studentStatuses.find(
          (s) => s.studentId === participant.userId
        );
        return {
          studentId: participant.userId,
          studentName: participant.name || participant.userId,
          status: (existing?.status || 'normal') as BehaviorStatus,
          isDistracted: existing?.isDistracted || false,
          distractionDuration: existing?.distractionDuration || 0,
          lastUpdate: existing?.lastUpdate || Date.now(),
          hasPermanentRecord: existing?.hasPermanentRecord || false,
        };
      });

    setStudentStatuses((prev) => {
      // Merge with existing statuses to preserve distraction data
      const merged = newStatuses.map((newStatus) => {
        const existing = prev.find((s) => s.studentId === newStatus.studentId);
        return existing || newStatus;
      });
      // Also keep any existing statuses that aren't in current participants
      const existingIds = new Set(newStatuses.map((s) => s.studentId));
      const additional = prev.filter((s) => !existingIds.has(s.studentId));
      return [...merged, ...additional];
    });
  }, [participants, isTeacher, user?.id]);

  // Sound alert for teacher when permanent record is created
  const handleTeacherSoundAlert = useCallback(() => {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 600;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 1
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  }, []);

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      {/* Distraction Monitoring - Active for students (non-teachers) */}
      {!isTeacher && (
        <DistractionMonitor
          onStatusUpdate={handleStatusUpdate}
          onPermanentRecord={handlePermanentRecord}
          enabled={true}
        />
      )}

      {/* Teacher Monitor - Only visible to teacher */}
      {isTeacher && (
        <TeacherMonitor
          studentStatuses={studentStatuses}
          onSoundAlert={handleTeacherSoundAlert}
        />
      )}

      <div className="relative flex size-full items-center justify-center">
        <div className=" flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        <div
          className={cn('h-[calc(100vh-86px)] hidden ml-2', {
            'show-block': showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      </div>
      {/* video layout and call controls */}
      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5">
        <CallControls onLeave={() => router.push(`/`)} />

        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  " aria-label="Layout options">
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    setLayout(item.toLowerCase() as CallLayoutType)
                  }
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <CallStatsButton />
        <button onClick={() => setShowParticipants((prev) => !prev)}>
          <div className=" cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
            <Users size={20} className="text-white" />
          </div>
        </button>
        {!isPersonalRoom && <EndCallButton />}
      </div>
    </section>
  );
};

export default MeetingRoom;

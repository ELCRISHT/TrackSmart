'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Users, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { BehaviorStatus } from '@/hooks/useMotionDetection';

interface StudentStatus {
  studentId: string;
  studentName: string;
  status: BehaviorStatus;
  isDistracted: boolean;
  distractionDuration: number;
  lastUpdate: number;
  hasPermanentRecord: boolean;
}

interface TeacherMonitorProps {
  studentStatuses: StudentStatus[];
  onSoundAlert?: () => void;
}

const TeacherMonitor = ({
  studentStatuses,
  onSoundAlert,
}: TeacherMonitorProps) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasPlayedSound, setHasPlayedSound] = useState<Set<string>>(new Set());

  const distractedStudents = studentStatuses.filter((s) => s.isDistracted);
  const permanentRecords = studentStatuses.filter((s) => s.hasPermanentRecord);

  useEffect(() => {
    // Play sound when a new permanent record is created
    permanentRecords.forEach((student) => {
      if (!hasPlayedSound.has(student.studentId) && onSoundAlert) {
        onSoundAlert();
        setHasPlayedSound((prev) => new Set(prev).add(student.studentId));
      }
    });
  }, [permanentRecords, hasPlayedSound, onSoundAlert]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getStatusIcon = (status: BehaviorStatus) => {
    switch (status) {
      case 'distracted':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'out-of-frame':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: BehaviorStatus) => {
    switch (status) {
      case 'distracted':
        return 'border-yellow-500 bg-yellow-900/20';
      case 'out-of-frame':
        return 'border-red-500 bg-red-900/20';
      default:
        return 'border-green-500 bg-green-900/20';
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg shadow-lg flex items-center gap-2"
        >
          <Users className="h-5 w-5" />
          <span className="font-semibold">
            Monitor ({distractedStudents.length} distracted)
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[600px] overflow-hidden">
      <Card className="border-blue-500 bg-dark-1 text-white shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-lg">Student Monitor</h3>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Minimize monitor"
            >
              <span className="text-xl">−</span>
            </button>
          </div>

          {permanentRecords.length > 0 && (
            <div className="mb-4 p-2 bg-red-900/30 border border-red-500 rounded">
              <p className="text-xs font-semibold text-red-300 mb-1">
                ⚠️ Permanent Records ({permanentRecords.length})
              </p>
              {permanentRecords.map((student) => (
                <p key={student.studentId} className="text-xs text-red-200">
                  {student.studentName} - {formatDuration(student.distractionDuration)}
                </p>
              ))}
            </div>
          )}

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {studentStatuses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No students in class
              </p>
            ) : (
              studentStatuses.map((student) => (
                <div
                  key={student.studentId}
                  className={`p-3 rounded border ${getStatusColor(student.status)}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(student.status)}
                      <span className="font-medium text-sm">{student.studentName}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {student.status === 'normal' ? 'Normal' : 'Distracted'}
                    </span>
                  </div>
                  {student.isDistracted && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-yellow-400" />
                      <span className="text-xs text-yellow-300">
                        {formatDuration(student.distractionDuration)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Total: {studentStatuses.length}</span>
              <span>Distracted: {distractedStudents.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherMonitor;


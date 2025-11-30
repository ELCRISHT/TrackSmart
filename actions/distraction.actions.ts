'use server';

import { currentUser } from '@clerk/nextjs/server';

export interface DistractionRecord {
  id: string;
  studentId: string;
  studentName: string;
  meetingId: string;
  startTime: number;
  endTime?: number;
  duration: number; // in seconds
  reason: 'motion' | 'tab-switch' | 'out-of-frame';
  isPermanent: boolean;
  timestamp: number;
}

// In-memory storage (replace with database in production)
const distractionRecords: DistractionRecord[] = [];

export const createDistractionRecord = async (
  record: Omit<DistractionRecord, 'id' | 'timestamp' | 'studentId' | 'studentName'>
): Promise<DistractionRecord> => {
  const user = await currentUser();

  if (!user) {
    throw new Error('User is not authenticated');
  }

  const newRecord: DistractionRecord = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    studentId: user.id,
    studentName: user.username || user.firstName || user.id,
    timestamp: Date.now(),
    ...record,
  };

  distractionRecords.push(newRecord);

  // In production, save to database here
  // await db.distractionRecords.create({ data: newRecord });

  return newRecord;
};

export const getDistractionRecords = async (
  meetingId?: string,
  studentId?: string
): Promise<DistractionRecord[]> => {
  const user = await currentUser();

  if (!user) {
    throw new Error('User is not authenticated');
  }

  let filtered = distractionRecords;

  if (meetingId) {
    filtered = filtered.filter((r) => r.meetingId === meetingId);
  }

  if (studentId) {
    filtered = filtered.filter((r) => r.studentId === studentId);
  }

  // In production, fetch from database
  // return await db.distractionRecords.findMany({ where: { ... } });

  return filtered;
};

export const getPermanentDistractionRecords = async (
  meetingId?: string
): Promise<DistractionRecord[]> => {
  const records = await getDistractionRecords(meetingId);
  return records.filter((r) => r.isPermanent);
};


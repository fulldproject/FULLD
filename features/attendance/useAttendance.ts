
import { useState, useEffect } from 'react';

export type AttendanceStatus = 'going' | 'interested' | null;

interface AttendanceRecord {
  editionId: string;
  status: AttendanceStatus;
}

export const useAttendance = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('fulld_attendance');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('fulld_attendance', JSON.stringify(attendance));
  }, [attendance]);

  const setStatus = (editionId: string, status: AttendanceStatus) => {
    setAttendance(prev => {
      const filtered = prev.filter(a => a.editionId !== editionId);
      if (status === null) return filtered;
      return [...filtered, { editionId, status }];
    });
  };

  const getStatus = (editionId: string): AttendanceStatus => {
    return attendance.find(a => a.editionId === editionId)?.status || null;
  };

  return { attendance, setStatus, getStatus };
};

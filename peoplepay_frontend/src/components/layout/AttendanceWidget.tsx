import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LogIn, LogOut, Loader2, Clock, AlertCircle } from 'lucide-react';
import { attendanceApi } from '../../services/api/attendance';
import { Attendance } from '../../types/attendance';
import { ApiError } from '../../services/api/client';
import { useAuth } from '../../hooks/useAuth';

export const AttendanceWidget: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const hasEmployeeProfile = Boolean(user?.employee_id);

  const [hasOpenCheckin, setHasOpenCheckin] = useState(false);
  const [openAttendance, setOpenAttendance] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await attendanceApi.getMyStatus();
      setHasOpenCheckin(res.data?.has_open_checkin || false);
      setOpenAttendance(res.data?.attendance || null);
    } catch (err) {
      console.warn('Failed to fetch attendance status:', err);
      setHasOpenCheckin(false);
      setOpenAttendance(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user, location.pathname]);

  const handleCheckIn = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await attendanceApi.checkIn();
      await fetchStatus();
    } catch (err: any) {
      const msg = err instanceof ApiError ? (err.message || 'Check-in failed') : (err?.message || 'Check-in failed');
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await attendanceApi.checkOut();
      await fetchStatus();
    } catch (err: any) {
      const msg = err instanceof ApiError ? (err.message || 'Check-out failed') : (err?.message || 'Check-out failed');
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasEmployeeProfile) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Status...</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {errorMsg && (
        <div className="absolute right-0 top-10 z-50 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shadow-md whitespace-nowrap animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {hasOpenCheckin ? (
        <div className="flex items-center gap-2">
          {openAttendance?.checkIn && (
            <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
              Checked in at {openAttendance.checkIn}
            </span>
          )}
          <button
            type="button"
            onClick={handleCheckOut}
            disabled={submitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Check Out</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={submitting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogIn className="w-3.5 h-3.5" />
          )}
          <span>Check In</span>
        </button>
      )}
    </div>
  );
};

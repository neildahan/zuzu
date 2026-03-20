import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkoutLogs, createWorkoutLog, updateWorkoutLog } from '../api/workoutLogs';
import { Timer, Square } from 'lucide-react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'zuzu-active-workout';

function readSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

// Custom event to sync across components
const SESSION_EVENT = 'zuzu-session-change';

export function useWorkoutSession() {
  const [session, setSession] = useState(readSession);

  useEffect(() => {
    const handler = () => setSession(readSession());
    window.addEventListener(SESSION_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(SESSION_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const startSession = (workoutId, programId, weekNumber) => {
    const s = { workoutId, programId, weekNumber, startedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    setSession(s);
    window.dispatchEvent(new Event(SESSION_EVENT));
  };

  const endSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    window.dispatchEvent(new Event(SESSION_EVENT));
  };

  return { session, startSession, endSession };
}

export function WorkoutTimerBar({ userId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, endSession } = useWorkoutSession();
  const [elapsed, setElapsed] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!session) return;
    const update = () => setElapsed(Math.floor((Date.now() - session.startedAt) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const endMut = useMutation({
    mutationFn: async () => {
      // Find or create the workout log, then mark as completed
      const logs = await getWorkoutLogs({ clientId: userId, workoutId: session.workoutId });
      const log = logs?.[0];
      if (log) {
        await updateWorkoutLog(log._id, { isCompleted: true });
      } else {
        const newLog = await createWorkoutLog({
          clientId: userId,
          workoutId: session.workoutId,
          programId: session.programId,
          weekNumber: session.weekNumber || 1,
          isCompleted: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      endSession();
      toast.success(t('client.workoutCompleted') || 'Workout completed!');
      navigate(`/client/${userId}`);
    },
    onError: () => toast.error(t('admin.actionFailed') || 'Failed'),
  });

  if (!session) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const hrs = Math.floor(mins / 60);
  const displayMins = mins % 60;

  return (
    <>
      {/* Floating timer bar */}
      <div className="fixed top-0 inset-x-0 z-[60] bg-gray-900/95 backdrop-blur-sm safe-area-top">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Timer size={16} className="text-accent" />
            </div>
            <div>
              <span className="text-white font-black text-lg tabular-nums">
                {hrs > 0 && `${hrs}:`}{displayMins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('client.training')}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm active:scale-95 transition-transform"
          >
            <Square size={14} fill="currentColor" />
            {t('client.endWorkout')}
          </button>
        </div>
      </div>

      {/* Spacer so content isn't hidden behind the bar */}
      <div className="h-14" />

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center">{t('client.endWorkoutConfirm')}</h3>
            <p className="text-sm text-gray-500 text-center">
              {t('client.workoutDuration')}: <span className="font-bold text-gray-900">
                {hrs > 0 && `${hrs}h `}{displayMins}m {secs}s
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => endMut.mutate()}
                disabled={endMut.isPending}
                className="flex-1 py-3 rounded-xl bg-accent text-white font-bold text-sm disabled:opacity-50"
              >
                {endMut.isPending ? '...' : t('client.endWorkout')}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

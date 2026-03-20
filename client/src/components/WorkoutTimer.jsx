import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkoutLogs, createWorkoutLog, updateWorkoutLog } from '../api/workoutLogs';
import { getWorkout } from '../api/workouts';
import { getExercises } from '../api/exercises';
import { Timer, Square } from 'lucide-react';
import WorkoutSummarySheet from './WorkoutSummarySheet';
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, endSession } = useWorkoutSession();
  const [elapsed, setElapsed] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // Fetch log + exercise data for summary
  const { data: logData } = useQuery({
    queryKey: ['workout-logs', { clientId: userId, workoutId: session?.workoutId }],
    queryFn: () => getWorkoutLogs({ clientId: userId, workoutId: session?.workoutId }),
    enabled: !!session,
  });

  const { data: exercisesList } = useQuery({
    queryKey: ['exercises', session?.workoutId],
    queryFn: () => getExercises(session?.workoutId),
    enabled: !!session,
  });

  useEffect(() => {
    if (!session) return;
    const update = () => setElapsed(Math.floor((Date.now() - session.startedAt) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const endMut = useMutation({
    mutationFn: async () => {
      const logs = await getWorkoutLogs({ clientId: userId, workoutId: session.workoutId });
      const log = logs?.[0];
      if (log) {
        await updateWorkoutLog(log._id, { isCompleted: true });
      } else {
        await createWorkoutLog({
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

  // Build exerciseLogs format from log data for the shared summary sheet
  const log = logData?.find(l => !l.isCompleted) || logData?.[0];
  const summaryExercises = (exercisesList || []).sort((a, b) => a.order - b.order);
  const summaryLogs = {};
  summaryExercises.forEach(ex => {
    const logEx = log?.exercises?.find(e => e.exerciseId === ex._id);
    summaryLogs[ex._id] = logEx?.sets || [];
  });

  return (
    <>
      {/* Floating timer bar */}
      <div className="fixed top-0 inset-x-0 z-[60] bg-gray-900/95 backdrop-blur-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2.5">
          <button
            onClick={() => navigate(`/client/${userId}/workout/${session.workoutId}/session`)}
            className="flex items-center gap-2.5"
          >
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
          </button>
          <button
            onClick={() => setShowSummary(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm active:scale-95 transition-transform"
          >
            <Square size={14} fill="currentColor" />
            {t('client.endWorkout')}
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-14" />

      {/* Summary sheet */}
      {showSummary && summaryExercises.length > 0 && (
        <WorkoutSummarySheet
          exercises={summaryExercises}
          exerciseLogs={summaryLogs}
          elapsed={elapsed}
          onFinish={() => endMut.mutate()}
          onKeepGoing={() => setShowSummary(false)}
          isPending={endMut.isPending}
        />
      )}
    </>
  );
}

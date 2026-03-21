import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getWorkout } from '../../api/workouts';
import { getExercises } from '../../api/exercises';
import { getWorkoutLogs, createWorkoutLog, updateWorkoutLog, getExerciseHistory } from '../../api/workoutLogs';
import { useSwipeable } from 'react-swipeable';
import RestTimerOverlay from '../../components/RestTimerOverlay';
import WorkoutSummarySheet from '../../components/WorkoutSummarySheet';
import { useWorkoutSession } from '../../components/WorkoutTimer';
import { Timer, ChevronLeft, ChevronRight, Check, Plus, Video, X, Trophy, Square } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkoutSession() {
  const { t, i18n } = useTranslation();
  const { cid, wid } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, endSession } = useWorkoutSession();
  const isHe = i18n.language === 'he';

  // Data
  const { data: workout } = useQuery({ queryKey: ['workout', wid], queryFn: () => getWorkout(wid) });
  const { data: exercises } = useQuery({ queryKey: ['exercises', wid], queryFn: () => getExercises(wid) });
  const { data: existingLogs } = useQuery({
    queryKey: ['workout-logs', { clientId: user._id, workoutId: wid }],
    queryFn: () => getWorkoutLogs({ clientId: user._id, workoutId: wid }),
    enabled: !!user,
    select: (data) => data?.sort((a, b) => new Date(b.date) - new Date(a.date)),
  });

  // Previous history for all exercises
  const { data: historyLogs } = useQuery({
    queryKey: ['history', user._id],
    queryFn: () => getExerciseHistory({ clientId: user._id }),
    enabled: !!user,
  });

  // State
  const [activeIndex, setActiveIndex] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [logId, setLogId] = useState(null);
  const [showRest, setShowRest] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const saveTimerRef = useRef(null);
  const sortedExercises = (exercises || []).sort((a, b) => a.order - b.order);
  const activeExercise = sortedExercises[activeIndex];

  // Elapsed timer
  useEffect(() => {
    if (!session) return;
    const update = () => setElapsed(Math.floor((Date.now() - session.startedAt) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Initialize exercise logs from existing data or defaults
  useEffect(() => {
    if (!exercises || exercises.length === 0) return;
    const sorted = [...exercises].sort((a, b) => a.order - b.order);

    // Find an in-progress (not completed) log, or start fresh
    const inProgressLog = existingLogs?.find(l => !l.isCompleted);
    const lastCompletedLog = existingLogs?.find(l => l.isCompleted);

    if (inProgressLog) {
      setLogId(inProgressLog._id);
    }

    const logs = {};
    sorted.forEach(ex => {
      // Resume from in-progress log
      if (inProgressLog) {
        const existing = inProgressLog.exercises?.find(e => e.exerciseId === ex._id);
        if (existing?.sets?.length) {
          logs[ex._id] = existing.sets;
          return;
        }
      }
      // Pre-fill from last completed session's actual values
      const prevEx = lastCompletedLog?.exercises?.find(e => e.exerciseId === ex._id);
      const prevSets = prevEx?.sets?.filter(s => s.isCompleted) || [];

      logs[ex._id] = Array.from({ length: ex.targets?.sets || 3 }, (_, i) => ({
        setNumber: i + 1,
        weight: prevSets[i]?.weight || ex.targets?.weight || 0,
        reps: prevSets[i]?.reps || ex.targets?.repsMin || 8,
        rir: ex.targets?.rir ?? 2,
        isCompleted: false,
      }));
    });
    setExerciseLogs(logs);
  }, [exercises, existingLogs]);

  // Auto-save (debounced)
  const autoSave = useCallback(async (logs) => {
    if (!workout || !user) return;
    try {
      let id = logId;
      if (!id) {
        const newLog = await createWorkoutLog({
          clientId: user._id,
          workoutId: wid,
          programId: workout.programId,
          weekNumber: workout.weekNumber || 1,
        });
        id = newLog._id;
        setLogId(id);
      }
      const exercisesData = Object.entries(logs).map(([exerciseId, sets]) => {
        const ex = sortedExercises.find(e => e._id === exerciseId);
        return {
          exerciseId,
          templateId: ex?.templateId || undefined,
          name: ex?.name || '',
          nameHe: ex?.nameHe || '',
          muscleGroup: ex?.muscleGroup || '',
          sets,
        };
      });
      await updateWorkoutLog(id, { exercises: exercisesData });
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [logId, workout, user, wid]);

  const triggerSave = useCallback((logs) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => autoSave(logs), 500);
  }, [autoSave]);

  // Set handlers
  const updateSet = (exerciseId, setIndex, field, value) => {
    setExerciseLogs(prev => {
      const next = { ...prev, [exerciseId]: prev[exerciseId].map((s, i) => i === setIndex ? { ...s, [field]: value } : s) };
      return next;
    });
  };

  const completeSet = (exerciseId, setIndex) => {
    setExerciseLogs(prev => {
      const sets = prev[exerciseId];
      const wasCompleted = sets[setIndex].isCompleted;
      const next = {
        ...prev,
        [exerciseId]: sets.map((s, i) => i === setIndex ? { ...s, isCompleted: !wasCompleted } : s),
      };
      if (!wasCompleted) {
        if (navigator.vibrate) navigator.vibrate(50);
        // Start rest timer if more sets remain
        const remaining = next[exerciseId].filter((s, i) => i > setIndex && !s.isCompleted);
        if (remaining.length > 0) {
          setShowRest(true);
        }
      }
      triggerSave(next);
      return next;
    });
  };

  const addSet = (exerciseId) => {
    setExerciseLogs(prev => {
      const sets = prev[exerciseId];
      const last = sets[sets.length - 1];
      return {
        ...prev,
        [exerciseId]: [...sets, {
          setNumber: sets.length + 1,
          weight: last?.weight || 0,
          reps: last?.reps || 8,
          rir: last?.rir ?? 2,
          isCompleted: false,
        }],
      };
    });
  };

  // Swipe between exercises
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setActiveIndex(i => Math.min(sortedExercises.length - 1, i + (isHe ? -1 : 1))),
    onSwipedRight: () => setActiveIndex(i => Math.max(0, i + (isHe ? 1 : -1))),
    preventScrollOnSwipe: true,
    delta: 50,
  });

  // Finish workout
  const handleFinish = async () => {
    try {
      let id = logId;
      if (!id) {
        const newLog = await createWorkoutLog({
          clientId: user._id, workoutId: wid,
          programId: workout.programId, weekNumber: workout.weekNumber || 1,
        });
        id = newLog._id;
      }
      const exercisesData = Object.entries(exerciseLogs).map(([exerciseId, sets]) => {
        const ex = sortedExercises.find(e => e._id === exerciseId);
        return {
          exerciseId,
          templateId: ex?.templateId || undefined,
          name: ex?.name || '',
          nameHe: ex?.nameHe || '',
          muscleGroup: ex?.muscleGroup || '',
          sets,
        };
      });
      await updateWorkoutLog(id, { exercises: exercisesData, isCompleted: true });
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      endSession();
      toast.success(t('client.workoutCompleted'));
      navigate(`/client/${cid}`);
    } catch (err) {
      toast.error(t('admin.actionFailed'));
    }
  };

  // Stats
  const totalSets = Object.values(exerciseLogs).flat().length;
  const completedSets = Object.values(exerciseLogs).flat().filter(s => s.isCompleted).length;
  const totalVolume = Object.values(exerciseLogs).flat().filter(s => s.isCompleted).reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
  const isExerciseComplete = (exId) => exerciseLogs[exId]?.every(s => s.isCompleted);
  const completedExercises = sortedExercises.filter(ex => isExerciseComplete(ex._id)).length;

  // Get previous session data for an exercise
  const getPrevious = (exerciseId) => {
    if (!historyLogs) return null;
    for (let i = historyLogs.length - 1; i >= 0; i--) {
      const log = historyLogs[i];
      const ex = log.exercises?.find(e => (e.exerciseId?._id || e.exerciseId) === exerciseId);
      if (ex?.sets?.length > 0) return ex.sets.filter(s => s.isCompleted);
    }
    return null;
  };

  const elapsedMins = Math.floor(elapsed / 60);
  const elapsedSecs = elapsed % 60;
  const elapsedHrs = Math.floor(elapsedMins / 60);
  const displayMins = elapsedMins % 60;

  if (!workout || !exercises) {
    return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session header */}
      <div className="sticky top-0 z-40 bg-gray-900 text-white px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0"
            >
              <ChevronLeft size={18} className="rtl:rotate-180" />
            </button>
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-accent" />
              <span className="font-black tabular-nums">
                {elapsedHrs > 0 && `${elapsedHrs}:`}{displayMins.toString().padStart(2, '0')}:{elapsedSecs.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-[11px] font-bold text-gray-400">
              {completedExercises}/{sortedExercises.length}
            </span>
            <button
              onClick={() => setShowFinish(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold active:scale-95 transition-transform"
            >
              <Square size={14} fill="currentColor" />
              {t('client.endWorkout')}
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1 mt-2">
            {sortedExercises.map((ex, i) => (
              <div key={ex._id} className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isExerciseComplete(ex._id) ? 'bg-emerald-400 w-full' :
                    i === activeIndex ? 'bg-accent' : 'w-0'
                  }`}
                  style={i === activeIndex && !isExerciseComplete(ex._id) ? {
                    width: `${((exerciseLogs[ex._id]?.filter(s => s.isCompleted).length || 0) / (exerciseLogs[ex._id]?.length || 1)) * 100}%`
                  } : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise tabs */}
      <div className="sticky top-[60px] z-30 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto flex gap-1 overflow-x-auto px-4 py-2 scrollbar-hide">
          {sortedExercises.map((ex, i) => (
            <button
              key={ex._id}
              onClick={() => setActiveIndex(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                i === activeIndex
                  ? 'bg-gray-900 text-white'
                  : isExerciseComplete(ex._id)
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isExerciseComplete(ex._id) && <Check size={12} />}
              {isHe && ex.nameHe ? ex.nameHe : ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise card */}
      <div {...swipeHandlers} className="max-w-lg mx-auto px-4 py-4">
        {activeExercise && (
          <div className="space-y-4">
            {/* Exercise header */}
            <div className="rounded-2xl bg-gray-900 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-extrabold">{isHe && activeExercise.nameHe ? activeExercise.nameHe : activeExercise.name}</h2>
                  {isHe && activeExercise.nameHe && <p className="text-xs text-gray-400 mt-0.5">{activeExercise.name}</p>}
                </div>
                {activeExercise.videoUrl && (
                  <a href={activeExercise.videoUrl} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                    <Video size={18} className="text-accent" />
                  </a>
                )}
              </div>
              {activeExercise.muscleGroup && (
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-accent/20 text-accent">
                    {t('muscle.' + activeExercise.muscleGroup)}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                    {t('client.target')}: {activeExercise.targets?.sets}×{activeExercise.targets?.repsMin}{activeExercise.targets?.repsMax ? `-${activeExercise.targets.repsMax}` : ''}
                    {activeExercise.targets?.weight ? ` @ ${activeExercise.targets.weight}kg` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Previous session */}
            {(() => {
              const prev = getPrevious(activeExercise._id);
              if (!prev || prev.length === 0) return null;
              return (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('client.previous')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {prev.map((s, i) => (
                      <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                        {s.weight}kg × {s.reps}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Set table */}
            <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[40px_1fr_1fr_1fr_48px] gap-0 px-3 py-2.5 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase">
                <span className="text-center">#</span>
                <span className="text-center">KG</span>
                <span className="text-center">{t('client.reps')}</span>
                <span className="text-center">RIR</span>
                <span className="text-center">✓</span>
              </div>

              {/* Set rows */}
              {exerciseLogs[activeExercise._id]?.map((set, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[40px_1fr_1fr_1fr_48px] gap-0 px-3 py-2 border-b border-gray-50 items-center transition-colors duration-200 ${
                    set.isCompleted ? 'bg-emerald-50/50' : ''
                  }`}
                >
                  <span className={`text-center text-sm font-bold ${set.isCompleted ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {set.setNumber}
                  </span>
                  <input
                    type="number"
                    value={set.weight}
                    onChange={(e) => updateSet(activeExercise._id, i, 'weight', Number(e.target.value))}
                    className="w-full text-center py-1.5 text-sm font-bold bg-transparent outline-none"
                  />
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => updateSet(activeExercise._id, i, 'reps', Number(e.target.value))}
                    className="w-full text-center py-1.5 text-sm font-bold bg-transparent outline-none"
                  />
                  <input
                    type="number"
                    value={set.rir}
                    onChange={(e) => updateSet(activeExercise._id, i, 'rir', Number(e.target.value))}
                    className="w-full text-center py-1.5 text-sm font-bold bg-transparent outline-none"
                  />
                  <div className="flex justify-center">
                    <button
                      onClick={() => completeSet(activeExercise._id, i)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                        set.isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add set */}
              <button
                onClick={() => addSet(activeExercise._id)}
                className="w-full flex items-center justify-center gap-1.5 py-3 text-sm font-bold text-gray-400 hover:text-accent transition-colors"
              >
                <Plus size={16} /> {t('client.addSet')}
              </button>
            </div>

            {/* Nav arrows */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
                disabled={activeIndex === 0}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-500 disabled:opacity-30 active:scale-95 transition-transform"
              >
                <ChevronLeft size={16} className="rtl:rotate-180" />
                {t('common.back')}
              </button>
              <span className="text-xs font-bold text-gray-400">
                {activeIndex + 1} / {sortedExercises.length}
              </span>
              {activeIndex < sortedExercises.length - 1 ? (
                <button
                  onClick={() => setActiveIndex(i => i + 1)}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold active:scale-95 transition-transform"
                >
                  {t('client.nextExercise') || 'Next'}
                  <ChevronRight size={16} className="rtl:rotate-180" />
                </button>
              ) : (
                <button
                  onClick={() => setShowFinish(true)}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold active:scale-95 transition-transform"
                >
                  <Trophy size={16} />
                  {t('client.finishWorkout')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rest timer overlay */}
      {showRest && (
        <RestTimerOverlay
          seconds={activeExercise?.targets?.restBetweenSets || 90}
          onComplete={() => setShowRest(false)}
          onDismiss={() => setShowRest(false)}
        />
      )}

      {/* Finish workout sheet */}
      {showFinish && (
        <WorkoutSummarySheet
          exercises={sortedExercises}
          exerciseLogs={exerciseLogs}
          elapsed={elapsed}
          onFinish={handleFinish}
          onKeepGoing={() => setShowFinish(false)}
        />
      )}
    </div>
  );
}

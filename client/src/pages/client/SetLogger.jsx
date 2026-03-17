import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkout } from '../../api/workouts';
import { getExercises } from '../../api/exercises';
import { getWorkoutLogs, createWorkoutLog, updateWorkoutLog, getPreviousLog } from '../../api/workoutLogs';
import { useState, useEffect, useMemo } from 'react';

export default function SetLogger() {
  const { t, i18n } = useTranslation();
  const { wid, eid } = useParams();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { data: workout } = useQuery({
    queryKey: ['workout', wid],
    queryFn: () => getWorkout(wid),
  });

  const { data: exercises } = useQuery({
    queryKey: ['exercises', wid],
    queryFn: () => getExercises(wid),
  });

  const exercise = useMemo(() => exercises?.find(e => e._id === eid), [exercises, eid]);

  const { data: previous } = useQuery({
    queryKey: ['previous-log', user?._id, eid],
    queryFn: () => getPreviousLog({ clientId: user._id, exerciseId: eid }),
    enabled: !!user && !!eid,
  });

  const { data: logs } = useQuery({
    queryKey: ['workout-logs', { clientId: user?._id, workoutId: wid }],
    queryFn: () => getWorkoutLogs({ clientId: user._id, workoutId: wid }),
    enabled: !!user,
  });

  const [currentLog, setCurrentLog] = useState(null);
  const [sets, setSets] = useState([]);
  const [saved, setSaved] = useState(false);

  const createLogMut = useMutation({
    mutationFn: (data) => createWorkoutLog(data),
    onSuccess: (log) => {
      setCurrentLog(log);
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
    },
  });

  const updateLogMut = useMutation({
    mutationFn: ({ id, data }) => updateWorkoutLog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  useEffect(() => {
    if (!logs || !exercise || !workout) return;

    const existingLog = logs[0];
    if (existingLog) {
      setCurrentLog(existingLog);
      const exLog = existingLog.exercises?.find(e => e.exerciseId === eid);
      if (exLog?.sets?.length) {
        setSets(exLog.sets);
        return;
      }
    }

    const prevSets = previous?.sets || [];
    const targetSets = exercise.targets.sets || 3;
    const initialSets = Array.from({ length: targetSets }, (_, i) => ({
      setNumber: i + 1,
      reps: prevSets[i]?.reps || exercise.targets.repsMin || 8,
      weight: prevSets[i]?.weight || exercise.targets.weight || 0,
      rir: exercise.targets.rir ?? 2,
      isCompleted: false,
    }));
    setSets(initialSets);
  }, [logs, exercise, workout, eid, previous]);

  const handleSetChange = (index, field, value) => {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const toggleSetComplete = (index) => {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, isCompleted: !s.isCompleted } : s));
  };

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets(prev => [...prev, {
      setNumber: prev.length + 1,
      reps: last?.reps || exercise?.targets.repsMin || 8,
      weight: last?.weight || 0,
      rir: last?.rir ?? 2,
      isCompleted: false,
    }]);
  };

  const handleSave = async () => {
    let logId = currentLog?._id;

    if (!logId) {
      const newLog = await createLogMut.mutateAsync({
        clientId: user._id,
        workoutId: wid,
        programId: workout.programId,
        weekNumber: workout.weekNumber || 1,
      });
      logId = newLog._id;
    }

    const existingExercises = currentLog?.exercises?.filter(e => e.exerciseId !== eid) || [];
    const updatedExercises = [...existingExercises, { exerciseId: eid, sets }];

    await updateLogMut.mutateAsync({
      id: logId,
      data: { exercises: updatedExercises },
    });
  };

  if (!exercise) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const completedSets = sets.filter(s => s.isCompleted).length;

  return (
    <div className="space-y-6">
      {/* Exercise header card */}
      <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">{i18n.language === 'he' && exercise.nameHe ? exercise.nameHe : exercise.name}</h2>
          {/* Video link button */}
          {exercise.videoUrl && (
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-accent/20 hover:bg-accent/30 flex items-center justify-center transition-colors shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#F97316" stroke="none">
                <path d="M8 5v14l11-7z" />
              </svg>
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {exercise.muscleGroup && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-accent/20 text-accent">{exercise.muscleGroup}</span>
          )}
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-gray-300">
            {exercise.targets.sets}x{exercise.targets.repsMin}{exercise.targets.repsMax ? `-${exercise.targets.repsMax}` : ''}
          </span>
          {exercise.targets.weight && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-gray-300">{exercise.targets.weight}kg</span>
          )}
          {exercise.targets.rir != null && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-gray-300">RIR {exercise.targets.rir}</span>
          )}
        </div>
        {exercise.notes && <p className="mt-3 text-sm text-gray-400">{exercise.notes}</p>}

        {/* Progress bar */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${sets.length ? (completedSets / sets.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-extrabold text-gray-400">{completedSets}/{sets.length}</span>
        </div>
      </div>

      {/* Previous performance */}
      {previous?.sets?.length > 0 && (
        <details className="rounded-2xl bg-accent/5 border border-accent/20 overflow-hidden group">
          <summary className="cursor-pointer p-4 text-sm text-accent font-bold flex items-center justify-between">
            <span>{t('client.previous')}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div className="px-4 pb-4">
            <div className="rounded-xl bg-white/80 overflow-hidden">
              {previous.sets.map((s, i) => (
                <div key={i} className={`flex items-center gap-6 px-4 py-2.5 text-sm ${i > 0 ? 'border-t border-accent/10' : ''}`}>
                  <span className="text-accent font-extrabold w-8">{s.setNumber}</span>
                  <span className="font-semibold text-gray-600">{s.weight}kg</span>
                  <span className="font-semibold text-gray-600">x {s.reps}</span>
                  {s.rir != null && <span className="text-gray-400 font-medium">RIR {s.rir}</span>}
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {/* Set logging table */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_2.5rem] gap-1.5 px-3 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">#</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">{t('trainer.weight')}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">{t('client.reps')}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">RIR</span>
          <span></span>
        </div>

        {/* Set rows */}
        {sets.map((set, i) => (
          <div
            key={i}
            className={`grid grid-cols-[1.5rem_1fr_1fr_1fr_2.5rem] gap-1.5 items-center px-3 py-3 border-b border-gray-50 transition-all duration-300 ${
              set.isCompleted ? 'bg-emerald-50/50' : ''
            }`}
          >
            <span className="text-sm font-extrabold text-gray-300 text-center">{i + 1}</span>
            <input
              type="number"
              value={set.weight}
              onChange={e => handleSetChange(i, 'weight', Number(e.target.value))}
              className="p-2 rounded-lg bg-gray-50 border border-gray-200 outline-none text-center text-sm font-bold focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all w-full min-w-0"
            />
            <input
              type="number"
              value={set.reps}
              onChange={e => handleSetChange(i, 'reps', Number(e.target.value))}
              className="p-2 rounded-lg bg-gray-50 border border-gray-200 outline-none text-center text-sm font-bold focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all w-full min-w-0"
            />
            <input
              type="number"
              value={set.rir}
              onChange={e => handleSetChange(i, 'rir', Number(e.target.value))}
              className="p-2 rounded-lg bg-gray-50 border border-gray-200 outline-none text-center text-sm font-bold focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all w-full min-w-0"
            />
            <button
              onClick={() => toggleSetComplete(i)}
              className={`w-8 h-8 rounded-lg border-2 text-sm font-bold transition-all mx-auto flex items-center justify-center shrink-0 ${
                set.isCompleted
                  ? 'bg-accent border-accent text-white shadow-md shadow-accent/30'
                  : 'bg-white border-gray-200 text-gray-300 hover:border-accent/50'
              }`}
            >
              {set.isCompleted && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Add set */}
      <button
        onClick={addSet}
        className="w-full p-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-accent hover:text-accent font-bold transition-colors"
      >
        + {t('client.addSet')}
      </button>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={updateLogMut.isPending || createLogMut.isPending}
        className={`w-full p-4 rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 ${
          saved
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
            : 'bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/30'
        }`}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            {t('client.completed')}
          </span>
        ) : t('common.save')}
      </button>
    </div>
  );
}

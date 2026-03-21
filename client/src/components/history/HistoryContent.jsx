import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExerciseHistory, deleteWorkoutLog, createWorkoutLog, updateWorkoutLog } from '../../api/workoutLogs';
import { getExerciseTemplates } from '../../api/exerciseTemplates';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search } from 'lucide-react';
import {
  computeWeightProgression,
  computeVolumeProgression,
  computeBestSet,
  extractExercises,
  computeSummaryStats,
} from '../../utils/historyMetrics';
import ProgressionChart from '../charts/ProgressionChart';
import MetricCard from '../charts/MetricCard';
import { BarChart3, ClipboardList, ChevronDown, Timer, Dumbbell } from 'lucide-react';

export default function HistoryContent({ clientId }) {
  const { t, i18n } = useTranslation();
  const isHe = i18n.language === 'he';
  const [tab, setTab] = useState('progress');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['history', clientId],
    queryFn: () => getExerciseHistory({ clientId }),
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasLogs = logs && logs.length > 0;
  const stats = hasLogs ? computeSummaryStats(logs) : { totalSessions: 0, totalVolume: 0, activeWeeks: 0 };

  return (
    <div className="space-y-4">
      {/* Hero stats */}
      <div className="rounded-2xl bg-gray-900 p-5 space-y-3">
        <h2 className="text-white font-extrabold text-lg">{t('history.myProgress')}</h2>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard value={stats.totalSessions} label={t('history.sessions')} color="bg-white/10" />
          <MetricCard
            value={stats.totalVolume > 999 ? `${(stats.totalVolume / 1000).toFixed(1)}k` : stats.totalVolume}
            label={t('history.vol')}
            color="bg-white/10"
          />
          <MetricCard value={stats.activeWeeks} label={t('trainer.weeks')} color="bg-white/10" />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('progress')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            tab === 'progress' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
          }`}
        >
          <BarChart3 size={16} />
          {t('history.progress')}
        </button>
        <button
          onClick={() => setTab('log')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            tab === 'log' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
          }`}
        >
          <ClipboardList size={16} />
          {t('history.workoutLog')}
        </button>
      </div>

      {tab === 'progress' ? (
        hasLogs ? (
          <ProgressTab logs={logs} t={t} isHe={isHe} />
        ) : (
          <div className="p-8 rounded-2xl bg-white shadow-sm border border-gray-100 text-center">
            <BarChart3 size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 font-medium">{t('history.noHistory')}</p>
          </div>
        )
      ) : (
        <WorkoutLogTab logs={logs || []} t={t} isHe={isHe} clientId={clientId} />
      )}
    </div>
  );
}

// ── Progress Tab ──────────────────────────────────────────
function ProgressTab({ logs, t, isHe }) {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [search, setSearch] = useState('');
  const grouped = extractExercises(logs);

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('history.searchExercises')}
          className="w-full ps-10 pe-4 py-3 text-sm rounded-2xl bg-white border border-gray-200 outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-gray-400 shadow-sm"
        />
      </div>
      {Object.entries(grouped).map(([group, exercises]) => {
        const q = search.toLowerCase();
        const filtered = q
          ? exercises.filter((ex) => {
              const name = (isHe && ex.nameHe ? ex.nameHe : ex.name).toLowerCase();
              const nameAlt = (ex.nameHe || '').toLowerCase();
              const groupLabel = (t(`muscle.${group}`) || group).toLowerCase();
              return name.includes(q) || nameAlt.includes(q) || ex.name.toLowerCase().includes(q) || groupLabel.includes(q);
            })
          : exercises;
        if (filtered.length === 0) return null;
        return (
          <div key={group} className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {t(`muscle.${group}`) || group}
            </span>
            {filtered.map((ex) => {
              const isOpen = selectedExercise === ex._id;
              const name = isHe && ex.nameHe ? ex.nameHe : ex.name;
              return (
                <div key={ex._id} className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setSelectedExercise(isOpen ? null : ex._id)}
                    className="w-full flex items-center justify-between p-4 text-start"
                  >
                    <div>
                      <span className="font-semibold text-gray-900">{name}</span>
                      {isHe && ex.nameHe && <span className="block text-[11px] text-gray-400">{ex.name}</span>}
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <ExerciseCharts logs={logs} exerciseId={ex._id} />}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Workout Log Tab ───────────────────────────────────────
function WorkoutLogTab({ logs, t, isHe, clientId }) {
  const [expandedId, setExpandedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const queryClient = useQueryClient();
  const locale = isHe ? 'he-IL' : 'en-US';

  const deleteMut = useMutation({
    mutationFn: deleteWorkoutLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history', clientId] });
      toast.success(t('history.workoutDeleted'));
    },
    onError: () => toast.error(t('admin.actionFailed')),
  });

  // Reverse to show newest first
  const sorted = [...logs].reverse();

  return (
    <div className="space-y-3">
      {/* Add workout button */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-accent hover:text-accent font-bold text-sm transition-colors"
      >
        <Plus size={16} />
        {t('history.addWorkout')}
      </button>

      {showAdd && (
        <AddManualWorkout
          clientId={clientId}
          t={t}
          isHe={isHe}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['history', clientId] });
            setShowAdd(false);
            toast.success(t('history.workoutAdded'));
          }}
        />
      )}

      {editingLog && (
        <AddManualWorkout
          clientId={clientId}
          t={t}
          isHe={isHe}
          existingLog={editingLog}
          onClose={() => setEditingLog(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['history', clientId] });
            setEditingLog(null);
            toast.success(t('history.workoutUpdated'));
          }}
        />
      )}

      {sorted.map((log) => {
        const isOpen = expandedId === log._id;
        const workoutName = log.workoutId?.name || t('nav.workouts');
        const workoutType = log.workoutId?.type;
        const date = new Date(log.date);
        const completedSets = log.exercises.flatMap(e => e.sets).filter(s => s.isCompleted);
        const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
        const exerciseCount = log.exercises.length;

        return (
          <div key={log._id} className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setExpandedId(isOpen ? null : log._id)}
              className="w-full p-4 text-start"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{workoutName}</span>
                    {workoutType && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        workoutType === 'strength' ? 'bg-accent/10 text-accent' :
                        workoutType === 'cardio' ? 'bg-blue-50 text-blue-500' :
                        'bg-purple-50 text-purple-500'
                      }`}>
                        {t('workoutType.' + workoutType)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-end">
                    <span className="text-sm font-bold text-gray-900">{completedSets.length}</span>
                    <span className="text-[10px] text-gray-400 font-medium block">{t('trainer.sets')}</span>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Quick stats row */}
              <div className="flex gap-3 mt-2">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                  <Dumbbell size={12} /> {exerciseCount} {t('trainer.exercises').toLowerCase()}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                  {totalVolume > 999 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume} {t('history.vol').toLowerCase()}
                </span>
              </div>
            </button>

            {/* Expanded: exercises + sets */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                {log.exercises.map((ex, i) => {
                  const info = ex.exerciseId && typeof ex.exerciseId === 'object' ? ex.exerciseId : null;
                  const name = info?.name || ex.name;
                  const nameHe = info?.nameHe || ex.nameHe;
                  const mg = info?.muscleGroup || ex.muscleGroup;
                  const exName = name ? (isHe && nameHe ? nameHe : name) : `${t('trainer.exercises')} ${i + 1}`;
                  const exNameSub = isHe && nameHe && name ? name : null;
                  const sets = ex.sets.filter(s => s.isCompleted);
                  if (sets.length === 0) return null;

                  return (
                    <div key={i} className="p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-bold text-gray-700">{exName}</span>
                          {exNameSub && <span className="block text-[10px] text-gray-400">{exNameSub}</span>}
                        </div>
                        {mg && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                            {t('muscle.' + mg)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sets.map((s, j) => (
                          <span key={j} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                            {s.weight}{t('history.kg')} × {s.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingLog(log);
                      setExpandedId(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-accent hover:bg-accent/5 text-xs font-bold transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(t('history.confirmDeleteWorkout'))) {
                        deleteMut.mutate(log._id);
                        setExpandedId(null);
                      }
                    }}
                    disabled={deleteMut.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-red-500 hover:bg-red-50 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    {t('history.deleteWorkout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Exercise Charts (unchanged) ──────────────────────────
function ExerciseCharts({ logs, exerciseId }) {
  const { t, i18n } = useTranslation();
  const weightData = computeWeightProgression(logs, exerciseId, i18n.language);
  const volumeData = computeVolumeProgression(logs, exerciseId, i18n.language);
  const bestSet = computeBestSet(logs, exerciseId);

  const sessions = [];
  for (const log of logs) {
    const ex = log.exercises.find((e) => {
      const info = e.exerciseId && typeof e.exerciseId === 'object' ? e.exerciseId : null;
      const name = info?.name || e.name || '';
      return name.toLowerCase() === exerciseId;
    });
    if (!ex) continue;
    const completedSets = ex.sets.filter(s => s.isCompleted);
    if (completedSets.length === 0) continue;
    sessions.push({ date: new Date(log.date), sets: completedSets });
  }

  const locale = i18n.language === 'he' ? 'he-IL' : 'en-US';
  const dateOpts = { day: 'numeric', month: 'short' };

  return (
    <div className="px-4 pb-4 space-y-4">
      {bestSet && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10">
          <span className="text-accent font-extrabold text-sm">🏆</span>
          <span className="text-sm font-semibold text-gray-700">
            {t('history.bestSet')}: {bestSet.weight}{t('history.kg')} × {bestSet.reps} {t('client.reps')}
          </span>
        </div>
      )}

      {sessions.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-2">{t('history.sessionLog')}</h4>
          <div className="space-y-2">
            {sessions.map((session, i) => (
              <div key={i} className="p-3 rounded-xl bg-gray-50">
                <span className="text-xs font-bold text-gray-500 mb-1.5 block">
                  {session.date.toLocaleDateString(locale, dateOpts)}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {session.sets.map((s, j) => (
                    <span key={j} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                      {s.weight}{t('history.kg')} × {s.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {weightData.length > 1 && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-2">{t('history.weightProgression')}</h4>
          <ProgressionChart data={weightData} dataKey="maxWeight" label={t('history.kg')} unit=" kg" />
        </div>
      )}

      {volumeData.length > 1 && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-2">{t('history.volumeProgression')}</h4>
          <ProgressionChart data={volumeData} dataKey="totalVolume" label={t('history.vol')} />
        </div>
      )}

      {weightData.length <= 1 && (
        <p className="text-sm text-gray-400 text-center py-4">{t('history.needMoreData')}</p>
      )}
    </div>
  );
}

// ── Add Manual Workout ───────────────────────────────────
function AddManualWorkout({ clientId, t, isHe, onClose, onSuccess, existingLog }) {
  const [date, setDate] = useState(
    existingLog ? new Date(existingLog.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [exercises, setExercises] = useState(() => {
    if (!existingLog) return [];
    return existingLog.exercises.map((ex, i) => {
      const info = ex.exerciseId && typeof ex.exerciseId === 'object' ? ex.exerciseId : null;
      return {
        id: Date.now() + i,
        exerciseId: info?._id || ex.exerciseId,
        name: info?.name || ex.name || '',
        nameHe: info?.nameHe || ex.nameHe || '',
        muscleGroup: info?.muscleGroup || ex.muscleGroup || '',
        sets: ex.sets.map(s => ({ ...s, isCompleted: true })),
      };
    });
  });
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: templates } = useQuery({
    queryKey: ['exercise-templates'],
    queryFn: () => getExerciseTemplates(),
  });

  const addExercise = (template) => {
    setExercises(prev => [...prev, {
      id: Date.now(),
      exerciseId: template._id,
      name: template.name,
      nameHe: template.nameHe || '',
      muscleGroup: template.muscleGroup || '',
      sets: [{ setNumber: 1, weight: 0, reps: 8, rir: 2, isCompleted: true }],
    }]);
    setShowSearch(false);
    setSearch('');
  };

  const updateSet = (exIndex, setIndex, field, value) => {
    setExercises(prev => prev.map((ex, i) => i === exIndex ? {
      ...ex,
      sets: ex.sets.map((s, j) => j === setIndex ? { ...s, [field]: Number(value) } : s),
    } : ex));
  };

  const addSet = (exIndex) => {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIndex) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return {
        ...ex,
        sets: [...ex.sets, { setNumber: ex.sets.length + 1, weight: last?.weight || 0, reps: last?.reps || 8, rir: 2, isCompleted: true }],
      };
    }));
  };

  const removeExercise = (exIndex) => {
    setExercises(prev => prev.filter((_, i) => i !== exIndex));
  };

  const handleSave = async () => {
    if (exercises.length === 0) return;
    setSaving(true);
    try {
      const exercisesData = exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        nameHe: ex.nameHe || '',
        muscleGroup: ex.muscleGroup || '',
        sets: ex.sets,
      }));
      if (existingLog) {
        await updateWorkoutLog(existingLog._id, { date, exercises: exercisesData });
      } else {
        await createWorkoutLog({ clientId, date, isCompleted: true, exercises: exercisesData });
      }
      onSuccess();
    } catch (err) {
      toast.error(t('admin.actionFailed'));
    } finally {
      setSaving(false);
    }
  };

  const filteredTemplates = templates?.filter(tp => {
    if (!search) return true;
    const q = search.toLowerCase();
    return tp.name.toLowerCase().includes(q) || (tp.nameHe || '').toLowerCase().includes(q);
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg mx-auto flex flex-col" style={{ height: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="shrink-0 px-6 pt-6 pb-3 border-b border-gray-100">
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-black">{existingLog ? t('history.editWorkout') : t('history.addWorkout')}</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Date picker */}
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('admin.date')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {/* Exercise list */}
          {exercises.map((ex, exIndex) => (
            <div key={ex.id} className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <div className="min-w-0">
                  <span className="font-bold text-sm text-gray-900">{isHe && ex.nameHe ? ex.nameHe : ex.name}</span>
                  {isHe && ex.nameHe && <span className="block text-[10px] text-gray-400">{ex.name}</span>}
                </div>
                <button onClick={() => removeExercise(exIndex)} className="text-red-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Sets */}
              <div className="px-3 py-2">
                <div className="grid grid-cols-[28px_1fr_1fr_1fr_28px] gap-1.5 text-[10px] font-bold text-gray-400 uppercase mb-1 px-0.5">
                  <span className="text-center">#</span>
                  <span className="text-center">KG</span>
                  <span className="text-center">{t('client.reps')}</span>
                  <span className="text-center">RIR</span>
                  <span></span>
                </div>
                {ex.sets.map((set, setIndex) => (
                  <div key={setIndex} className="grid grid-cols-[28px_1fr_1fr_1fr_28px] gap-1.5 items-center mb-1.5">
                    <span className="text-xs font-bold text-gray-400 text-center">{set.setNumber}</span>
                    <input type="number" value={set.weight} onChange={e => updateSet(exIndex, setIndex, 'weight', e.target.value)}
                      className="w-full text-center py-1.5 text-sm font-bold bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-accent/20" />
                    <input type="number" value={set.reps} onChange={e => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                      className="w-full text-center py-1.5 text-sm font-bold bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-accent/20" />
                    <input type="number" value={set.rir} onChange={e => updateSet(exIndex, setIndex, 'rir', e.target.value)}
                      className="w-full text-center py-1.5 text-sm font-bold bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-accent/20" />
                    <button
                      onClick={() => {
                        setExercises(prev => prev.map((e, i) => i === exIndex ? {
                          ...e,
                          sets: e.sets.filter((_, j) => j !== setIndex).map((s, j) => ({ ...s, setNumber: j + 1 })),
                        } : e));
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addSet(exIndex)}
                  className="w-full text-center py-1.5 text-xs font-bold text-gray-400 hover:text-accent transition-colors"
                >
                  + {t('client.addSet')}
                </button>
              </div>
            </div>
          ))}

          {/* Add exercise */}
          {showSearch ? (
            <div className="rounded-2xl border border-accent/30 overflow-hidden">
              <div className="relative">
                <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('history.searchExercises')}
                  autoFocus
                  className="w-full ps-9 pe-4 py-3 text-sm outline-none border-b border-gray-100"
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredTemplates.map(tp => (
                  <button
                    key={tp._id}
                    onClick={() => addExercise(tp)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-start"
                  >
                    <div>
                      <span className="font-semibold text-gray-900">{isHe && tp.nameHe ? tp.nameHe : tp.name}</span>
                      {isHe && tp.nameHe && <span className="block text-[10px] text-gray-400">{tp.name}</span>}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {tp.muscleGroup && t('muscle.' + tp.muscleGroup)}
                    </span>
                  </button>
                ))}
                {filteredTemplates.length === 0 && (
                  <p className="text-center py-4 text-sm text-gray-400">{t('admin.noResults')}</p>
                )}
              </div>
              <button onClick={() => { setShowSearch(false); setSearch(''); }}
                className="w-full py-2 text-xs font-bold text-gray-400 border-t border-gray-100">{t('common.cancel')}</button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-accent hover:text-accent font-bold text-sm transition-colors"
            >
              <Plus size={16} />
              {t('trainer.addExercise')}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-white border-t border-gray-100 px-6 pt-4 pb-24 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || exercises.length === 0}
            className="flex-1 py-4 rounded-2xl bg-accent text-white font-bold disabled:opacity-50 text-base"
          >
            {saving ? '...' : t('common.save')}
          </button>
          <button onClick={onClose} className="py-4 px-6 rounded-2xl bg-gray-100 text-gray-600 font-bold text-base">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

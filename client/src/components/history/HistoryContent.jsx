import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getExerciseHistory } from '../../api/workoutLogs';
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

  if (!logs || logs.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-3">
          <BarChart3 size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-400 font-medium">{t('history.noHistory')}</p>
      </div>
    );
  }

  const stats = computeSummaryStats(logs);

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
        <ProgressTab logs={logs} t={t} isHe={isHe} />
      ) : (
        <WorkoutLogTab logs={logs} t={t} isHe={isHe} />
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
function WorkoutLogTab({ logs, t, isHe }) {
  const [expandedId, setExpandedId] = useState(null);
  const locale = isHe ? 'he-IL' : 'en-US';

  // Reverse to show newest first
  const sorted = [...logs].reverse();

  return (
    <div className="space-y-3">
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
                  const info = ex.exerciseId;
                  const exName = info ? (isHe && info.nameHe ? info.nameHe : info.name) : `${t('trainer.exercises')} ${i + 1}`;
                  const exNameSub = info && isHe && info.nameHe ? info.name : null;
                  const sets = ex.sets.filter(s => s.isCompleted);
                  if (sets.length === 0) return null;

                  return (
                    <div key={i} className="p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-bold text-gray-700">{exName}</span>
                          {exNameSub && <span className="block text-[10px] text-gray-400">{exNameSub}</span>}
                        </div>
                        {info?.muscleGroup && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                            {t('muscle.' + info.muscleGroup)}
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
  const weightData = computeWeightProgression(logs, exerciseId);
  const volumeData = computeVolumeProgression(logs, exerciseId);
  const bestSet = computeBestSet(logs, exerciseId);

  const sessions = [];
  for (const log of logs) {
    const ex = log.exercises.find(
      (e) => (e.exerciseId?._id || e.exerciseId)?.toString() === exerciseId
    );
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

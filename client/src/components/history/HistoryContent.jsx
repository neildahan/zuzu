import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getExerciseHistory } from '../../api/workoutLogs';
import {
  computeWeightProgression,
  computeVolumeProgression,
  computeBestSet,
  computeMuscleGroupVolume,
  extractExercises,
  computeSummaryStats,
} from '../../utils/historyMetrics';
import ProgressionChart from '../charts/ProgressionChart';
import MuscleGroupChart from '../charts/MuscleGroupChart';
import MetricCard from '../charts/MetricCard';

export default function HistoryContent({ clientId }) {
  const { t, i18n } = useTranslation();
  const isHe = i18n.language === 'he';
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [search, setSearch] = useState('');

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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <p className="text-gray-400 font-medium">{t('history.noHistory')}</p>
      </div>
    );
  }

  const stats = computeSummaryStats(logs);
  const grouped = extractExercises(logs);
  const muscleVolume = computeMuscleGroupVolume(logs);

  return (
    <div className="space-y-6">
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

      {/* Exercises by muscle group */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-gray-900">{t('history.byMuscleGroup')}</h3>
        <div className="relative">
          <svg className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('history.searchExercises')}
            className="w-full ps-10 pe-4 py-3 text-sm rounded-2xl bg-white border border-gray-200 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 placeholder:text-gray-400 shadow-sm"
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
                    <span className="font-semibold text-gray-900">{name}</span>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isOpen && <ExerciseCharts logs={logs} exerciseId={ex._id} />}
                </div>
              );
            })}
          </div>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseCharts({ logs, exerciseId }) {
  const { t, i18n } = useTranslation();
  const weightData = computeWeightProgression(logs, exerciseId);
  const volumeData = computeVolumeProgression(logs, exerciseId);
  const bestSet = computeBestSet(logs, exerciseId);

  // Extract session history for this exercise
  const sessions = [];
  for (const log of logs) {
    const ex = log.exercises.find(
      (e) => (e.exerciseId?._id || e.exerciseId)?.toString() === exerciseId
    );
    if (!ex) continue;
    const completedSets = ex.sets.filter(s => s.isCompleted);
    if (completedSets.length === 0) continue;
    sessions.push({
      date: new Date(log.date),
      sets: completedSets,
    });
  }

  const dateOpts = { day: 'numeric', month: 'short' };
  const locale = i18n.language === 'he' ? 'he-IL' : 'en-US';

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

      {/* Session-by-session log */}
      {sessions.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-2">{t('history.sessionLog')}</h4>
          <div className="space-y-2">
            {sessions.map((session, i) => (
              <div key={i} className="p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="text-xs font-bold text-gray-500">
                    {session.date.toLocaleDateString(locale, dateOpts)}
                  </span>
                </div>
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

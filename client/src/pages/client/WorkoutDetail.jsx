import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useQuery } from '@tanstack/react-query';
import { getWorkout } from '../../api/workouts';
import { getExercises } from '../../api/exercises';

const TYPE_COLORS = {
  strength: 'bg-accent/10 text-accent',
  cardio: 'bg-blue-50 text-blue-500',
  hybrid: 'bg-purple-50 text-purple-500',
};

const MUSCLE_COLORS = {
  Chest: 'bg-red-50 text-red-500',
  Back: 'bg-blue-50 text-blue-500',
  Shoulders: 'bg-amber-50 text-amber-600',
  Biceps: 'bg-purple-50 text-purple-500',
  Triceps: 'bg-indigo-50 text-indigo-500',
  Quads: 'bg-emerald-50 text-emerald-600',
  Hamstrings: 'bg-teal-50 text-teal-600',
  Glutes: 'bg-pink-50 text-pink-500',
  Calves: 'bg-cyan-50 text-cyan-600',
  Core: 'bg-accent/10 text-accent',
  'Full Body': 'bg-gray-100 text-gray-600',
};

export default function WorkoutDetail() {
  const { t } = useTranslation();
  const { wid } = useParams();
  const { user } = useUser();

  const { data: workout } = useQuery({
    queryKey: ['workout', wid],
    queryFn: () => getWorkout(wid),
  });

  const { data: exercises } = useQuery({
    queryKey: ['exercises', wid],
    queryFn: () => getExercises(wid),
  });

  if (!workout) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const totalSets = exercises?.reduce((sum, ex) => sum + (ex.targets?.sets || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${TYPE_COLORS[workout.type] || 'bg-white/10 text-gray-400'}`}>
            {workout.type}
          </span>
        </div>
        <h2 className="text-3xl font-extrabold">{workout.name}</h2>

        {/* Stats row */}
        <div className="flex gap-8 mt-5">
          <div>
            <span className="text-3xl font-extrabold">{exercises?.length || 0}</span>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{t('trainer.exercises')}</p>
          </div>
          <div>
            <span className="text-3xl font-extrabold">{totalSets}</span>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{t('trainer.sets')}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          {exercises?.length > 0 && (
            <Link
              to={`/client/${user._id}/workout/${wid}/exercise/${exercises[0]._id}`}
              className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold transition-colors shadow-lg shadow-accent/30"
            >
              {t('client.startWorkout')}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          )}
        </div>
      </div>

      {/* Exercise list */}
      {!exercises?.length ? (
        <div className="p-8 rounded-2xl bg-white shadow-sm border border-gray-100 text-center">
          <p className="text-gray-400 font-medium">{t('client.noExercises')}</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">{t('trainer.exercises')} ({exercises.length})</h3>
          </div>
          <div className="space-y-3">
            {exercises.sort((a, b) => a.order - b.order).map((ex, i) => (
              <Link
                key={ex._id}
                to={`/client/${user._id}/workout/${wid}/exercise/${ex._id}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98]"
              >
                {/* Exercise number badge */}
                <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 truncate">{ex.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {ex.muscleGroup && (
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${MUSCLE_COLORS[ex.muscleGroup] || 'bg-gray-100 text-gray-500'}`}>
                        {ex.muscleGroup}
                      </span>
                    )}
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {ex.targets.sets} x {ex.targets.repsMin}{ex.targets.repsMax ? `-${ex.targets.repsMax}` : ''}
                    </span>
                    {ex.targets.weight && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-accent/10 text-accent">
                        {ex.targets.weight}kg
                      </span>
                    )}
                    {ex.targets.rir != null && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-500">
                        RIR {ex.targets.rir}
                      </span>
                    )}
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

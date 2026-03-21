import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useQuery, useQueries } from '@tanstack/react-query';
import { getPrograms } from '../../api/programs';
import { getWorkouts } from '../../api/workouts';
import { getExercises } from '../../api/exercises';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getNextDate(dayOfWeek) {
  const today = new Date();
  const todayDay = today.getDay();
  let diff = dayOfWeek - todayDay;
  if (diff < 0) diff += 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next;
}

const TYPE_COLORS = {
  strength: 'bg-accent/10 text-accent',
  cardio: 'bg-blue-50 text-blue-500',
  hybrid: 'bg-purple-50 text-purple-500',
};

const TYPE_STRIP = {
  strength: 'bg-accent',
  cardio: 'bg-blue-500',
  hybrid: 'bg-purple-500',
};

export default function WorkoutList() {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const [selectedWeek, setSelectedWeek] = useState(1);

  const { data: programs } = useQuery({
    queryKey: ['programs', { clientId: user._id, active: true }],
    queryFn: () => getPrograms({ clientId: user._id, active: true }),
  });

  const program = programs?.[0];

  const { data: workouts } = useQuery({
    queryKey: ['workouts', program?._id, selectedWeek],
    queryFn: () => getWorkouts(program._id, { week: selectedWeek }),
    enabled: !!program,
  });

  const exerciseQueries = useQueries({
    queries: (workouts || []).map(w => ({
      queryKey: ['exercises', w._id],
      queryFn: () => getExercises(w._id),
    })),
  });
  const exerciseCounts = {};
  (workouts || []).forEach((w, i) => {
    exerciseCounts[w._id] = exerciseQueries[i]?.data?.length;
  });

  if (!program) return (
    <div className="p-12 rounded-3xl bg-white shadow-sm border border-gray-100 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><path d="M6.5 6.5h11M6.5 17.5h11M3 10.5v3M21 10.5v3M5 8v8M19 8v8M7 6v12M17 6v12" /></svg>
      </div>
      <p className="text-gray-400 font-medium">{t('client.noWorkouts')}</p>
    </div>
  );

  const weeks = Array.from({ length: program.weekCount }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Program header */}
      <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 text-white">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-accent uppercase tracking-widest">
            {program.weekCount === 1 ? (i18n.language === 'he' ? 'תוכנית שבועית חוזרת' : 'Repeating Weekly') : `${t('common.week')} ${selectedWeek}`}
          </span>
          {program.weekCount === 1 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
              ∞
            </span>
          )}
        </div>
        <h2 className="text-2xl font-extrabold mt-1">{program.name}</h2>
        <div className="flex gap-6 mt-3">
          <div>
            <span className="text-2xl font-extrabold">{workouts?.length || 0}</span>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{t('nav.workouts')}</p>
          </div>
        </div>
      </div>

      {/* Week tabs - only show if multi-week */}
      {program.weekCount > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {weeks.map(w => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                selectedWeek === w
                  ? 'bg-accent text-white shadow-md shadow-accent/30'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t('common.week')} {w}
            </button>
          ))}
        </div>
      )}

      {/* Workout cards */}
      <div className="space-y-3">
        {[...(workouts || [])].sort((a, b) => getNextDate(a.dayOfWeek) - getNextDate(b.dayOfWeek)).map(workout => (
          <Link
            key={workout._id}
            to={`/client/${user._id}/workout/${workout._id}`}
            className="block rounded-2xl bg-gray-900 hover:bg-gray-800 transition-all active:scale-[0.98] overflow-hidden"
          >
            <div className="flex">
              {/* Color strip */}
              <div className={`w-1.5 ${TYPE_STRIP[workout.type] || 'bg-gray-600'}`} />
              <div className="flex-1 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white">{workout.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-gray-300">
                        {t('days.' + workout.dayOfWeek)}
                      </span>
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${TYPE_COLORS[workout.type] || 'bg-white/10 text-gray-400'}`}>
                        {t('workoutType.' + workout.type)}
                      </span>
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-gray-300">
                        {exerciseCounts[workout._id] ?? '–'} {t('trainer.exercises').toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {(!workouts || workouts.length === 0) && (
        <div className="p-8 rounded-2xl bg-white shadow-sm border border-gray-100 text-center">
          <p className="text-gray-400 font-medium">{t('client.noWorkouts')}</p>
        </div>
      )}
    </div>
  );
}

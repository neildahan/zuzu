import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useQuery, useQueries } from '@tanstack/react-query';
import { getPrograms } from '../../api/programs';
import { getWorkouts } from '../../api/workouts';
import { getExerciseCount, getExercises } from '../../api/exercises';
import { Link } from 'react-router-dom';

function getNextDate(dayOfWeek) {
  const today = new Date();
  const todayDay = today.getDay();
  let diff = dayOfWeek - todayDay;
  if (diff < 0) diff += 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next;
}

export default function ClientHome() {
  const { t, i18n } = useTranslation();
  const { user } = useUser();

  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs', { clientId: user._id, active: true }],
    queryFn: () => getPrograms({ clientId: user._id, active: true }),
  });

  const program = programs?.[0];

  const { data: workouts } = useQuery({
    queryKey: ['workouts', program?._id, 1],
    queryFn: () => getWorkouts(program._id, { week: 1 }),
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

  const { data: exerciseCount } = useQuery({
    queryKey: ['exerciseCount', program?._id],
    queryFn: () => getExerciseCount(program._id, 1),
    enabled: !!program,
  });

  if (isLoading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-[3px] border-accent border-t-transparent rounded-full animate-spin" /></div>;

  if (!program) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><path d="M6.5 6.5h11M6.5 17.5h11M3 10.5v3M21 10.5v3M5 8v8M19 8v8M7 6v12M17 6v12" /></svg>
        </div>
        <p className="text-gray-400 font-semibold">{t('client.noWorkouts')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Program info card */}
      <div className="rounded-3xl overflow-hidden relative">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80')" }}
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/90 to-gray-900/70" />

        <div className="relative z-10 p-6 text-white">
          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.15em]">{t('client.currentWeek')}</span>
          <h2 className="text-[28px] font-black mt-1 leading-tight">{program.name}</h2>
          {program.description && <p className="text-sm text-gray-300/60 mt-1">{program.description}</p>}

          <div className="flex gap-8 mt-5">
            {program.weekCount > 1 && (
              <div>
                <span className="text-[32px] font-black leading-none">{program.weekCount}</span>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{t('trainer.weeks')}</p>
              </div>
            )}
            <div>
              <span className="text-[32px] font-black leading-none">{exerciseCount ?? '–'}</span>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{t('trainer.exercises')}</p>
            </div>
            <div>
              <span className="text-[32px] font-black leading-none">{workouts?.length || 0}</span>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{t('nav.workouts')}</p>
            </div>
          </div>

          <Link
            to={`/client/${user._id}/workouts`}
            className="flex items-center justify-center gap-2 w-full mt-6 p-4 rounded-2xl bg-accent font-bold shadow-lg shadow-accent/30 active:scale-[0.98] transition-transform"
          >
            {t('client.startWorkout')}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>

      {/* Upcoming workouts */}
      {workouts?.length > 0 && (() => {
        const locale = i18n.language === 'he' ? 'he-IL' : 'en-US';
        const sorted = [...workouts]
          .map(w => ({ ...w, nextDate: getNextDate(w.dayOfWeek) }))
          .sort((a, b) => a.nextDate - b.nextDate);

        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black">{t('client.upcoming')}</h3>
              <Link to={`/client/${user._id}/workouts`} className="text-sm font-bold text-accent">{t('common.seeAll')}</Link>
            </div>
            <div className="space-y-3">
              {sorted.map(w => {
                const isToday = w.nextDate.toDateString() === new Date().toDateString();
                return (
                  <Link
                    key={w._id}
                    to={`/client/${user._id}/workout/${w._id}`}
                    className="block rounded-2xl bg-gray-900 overflow-hidden active:scale-[0.98] transition-transform"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isToday ? '#F97316' : '#6B7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span className={`text-xs font-bold ${isToday ? 'text-accent' : 'text-gray-400'}`}>
                            {isToday
                              ? t('client.today')
                              : w.nextDate.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })
                            }
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                              {t('client.today')}
                            </span>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${isToday ? 'bg-accent/10 text-accent' : 'bg-white/[0.06] text-gray-500'}`}>
                          {t('workoutType.' + w.type)}
                        </span>
                      </div>
                      <h4 className="text-white font-black text-xl">{w.name}</h4>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-gray-500 text-xs font-semibold">
                          {exerciseCounts[w._id] ?? '–'} {t('trainer.exercises').toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

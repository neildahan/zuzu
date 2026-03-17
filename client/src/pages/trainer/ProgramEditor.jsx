import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProgram } from '../../api/programs';
import { getWorkouts, createWorkout } from '../../api/workouts';
import { useState } from 'react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TYPE_COLORS = {
  strength: 'bg-accent/10 text-accent border-accent/20',
  cardio: 'bg-blue-50 text-blue-500 border-blue-100',
  hybrid: 'bg-purple-50 text-purple-500 border-purple-100',
};

const TYPE_STRIP = {
  strength: 'bg-accent',
  cardio: 'bg-blue-500',
  hybrid: 'bg-purple-500',
};

export default function ProgramEditor() {
  const { t } = useTranslation();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [newWorkout, setNewWorkout] = useState({ name: '', dayOfWeek: 0, type: 'strength' });

  const { data: program } = useQuery({
    queryKey: ['program', id],
    queryFn: () => getProgram(id),
  });

  const { data: workouts } = useQuery({
    queryKey: ['workouts', id, selectedWeek],
    queryFn: () => getWorkouts(id, { week: selectedWeek }),
  });

  const addMutation = useMutation({
    mutationFn: (data) => createWorkout(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', id] });
      setShowAdd(false);
      setNewWorkout({ name: '', dayOfWeek: 0, type: 'strength' });
    },
  });

  const handleAddWorkout = (e) => {
    e.preventDefault();
    addMutation.mutate({
      ...newWorkout,
      weekNumber: selectedWeek,
      order: workouts?.length || 0,
    });
  };

  if (!program) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const weeks = Array.from({ length: program.weekCount }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Program header */}
      <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 text-white">
        <span className="text-[11px] font-bold text-accent uppercase tracking-widest">Program</span>
        <h2 className="text-2xl font-extrabold mt-1">{program.name}</h2>
        {program.description && <p className="text-sm text-gray-400 mt-1">{program.description}</p>}
        <div className="flex gap-6 mt-4">
          <div>
            <span className="text-2xl font-extrabold">{program.weekCount}</span>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{t('trainer.weeks')}</p>
          </div>
          <div>
            <span className="text-2xl font-extrabold">{workouts?.length || 0}</span>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{t('nav.workouts') || 'Workouts'}</p>
          </div>
        </div>
      </div>

      {/* Week tabs */}
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

      {/* Workout cards */}
      <div className="space-y-3">
        {workouts?.sort((a, b) => a.order - b.order).map(workout => (
          <Link
            key={workout._id}
            to={`/trainer/program/${id}/workout/${workout._id}`}
            className="block rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98] overflow-hidden"
          >
            <div className="flex">
              {/* Color strip */}
              <div className={`w-1.5 ${TYPE_STRIP[workout.type] || 'bg-gray-300'}`} />
              <div className="flex-1 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-gray-900">{workout.name}</span>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                      {DAY_NAMES[workout.dayOfWeek]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${TYPE_COLORS[workout.type] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {workout.type}
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Add workout */}
      {showAdd ? (
        <form onSubmit={handleAddWorkout} className="p-5 rounded-2xl bg-white shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900">{t('trainer.addWorkout')}</h3>
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.workoutName')}</label>
            <input
              type="text"
              value={newWorkout.name}
              onChange={e => setNewWorkout(w => ({ ...w, name: e.target.value }))}
              placeholder={t('trainer.workoutName')}
              className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
              required
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-500 mb-1.5">Day</label>
              <select
                value={newWorkout.dayOfWeek}
                onChange={e => setNewWorkout(w => ({ ...w, dayOfWeek: Number(e.target.value) }))}
                className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
              >
                {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-500 mb-1.5">Type</label>
              <select
                value={newWorkout.type}
                onChange={e => setNewWorkout(w => ({ ...w, type: e.target.value }))}
                className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
              >
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={addMutation.isPending} className="flex-1 p-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold transition-colors shadow-lg shadow-accent/30 disabled:opacity-50">
              {t('common.save')}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="p-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-accent hover:text-accent font-bold transition-colors"
        >
          + {t('trainer.addWorkout')}
        </button>
      )}
    </div>
  );
}

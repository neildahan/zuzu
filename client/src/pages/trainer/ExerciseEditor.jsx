import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkout } from '../../api/workouts';
import { getExercises, createExercise, updateExercise, deleteExercise } from '../../api/exercises';
import { useState } from 'react';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body'];

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

const emptyExercise = {
  name: '', muscleGroup: '', videoUrl: '', notes: '',
  targets: { sets: 3, repsMin: 8, repsMax: 12, weight: '', rir: 2, restBetweenSets: 90, restAfterExercise: 120 }
};

export default function ExerciseEditor() {
  const { t } = useTranslation();
  const { id, wid } = useParams();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyExercise);

  const { data: workout } = useQuery({
    queryKey: ['workout', wid],
    queryFn: () => getWorkout(wid),
  });

  const { data: exercises } = useQuery({
    queryKey: ['exercises', wid],
    queryFn: () => getExercises(wid),
  });

  const createMut = useMutation({
    mutationFn: (data) => createExercise(wid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', wid] });
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateExercise(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', wid] });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteExercise(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises', wid] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyExercise);
  };

  const handleEdit = (ex) => {
    setForm({
      name: ex.name,
      muscleGroup: ex.muscleGroup || '',
      videoUrl: ex.videoUrl || '',
      notes: ex.notes || '',
      targets: { ...emptyExercise.targets, ...ex.targets },
    });
    setEditingId(ex._id);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      targets: {
        ...form.targets,
        sets: Number(form.targets.sets),
        repsMin: Number(form.targets.repsMin),
        repsMax: form.targets.repsMax ? Number(form.targets.repsMax) : undefined,
        weight: form.targets.weight ? Number(form.targets.weight) : undefined,
        rir: form.targets.rir !== '' ? Number(form.targets.rir) : undefined,
        restBetweenSets: Number(form.targets.restBetweenSets),
        restAfterExercise: Number(form.targets.restAfterExercise),
      },
      order: exercises?.length || 0,
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, data });
    } else {
      createMut.mutate(data);
    }
  };

  const setTarget = (key, value) => {
    setForm(f => ({ ...f, targets: { ...f.targets, [key]: value } }));
  };

  if (!workout) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 text-white">
        <span className="text-[11px] font-bold text-accent uppercase tracking-widest">{t('trainer.exercises')}</span>
        <h2 className="text-2xl font-extrabold mt-1">{workout.name}</h2>
        <div className="flex gap-6 mt-3">
          <div>
            <span className="text-2xl font-extrabold">{exercises?.length || 0}</span>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{t('trainer.exercises')}</p>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-3">
        {exercises?.sort((a, b) => a.order - b.order).map((ex, i) => (
          <div key={ex._id} className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Number badge */}
                <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg text-gray-900">{ex.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(ex)}
                        className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-accent/10 flex items-center justify-center transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => deleteMut.mutate(ex._id)}
                        className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-red-50 flex items-center justify-center transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ex.muscleGroup && (
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${MUSCLE_COLORS[ex.muscleGroup] || 'bg-gray-100 text-gray-500'}`}>
                        {ex.muscleGroup}
                      </span>
                    )}
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                      {ex.targets.sets} {t('trainer.sets')}
                    </span>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                      {ex.targets.repsMin}{ex.targets.repsMax ? `-${ex.targets.repsMax}` : ''} {t('client.reps')}
                    </span>
                    {ex.targets.weight && (
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-accent/10 text-accent">
                        {ex.targets.weight}kg
                      </span>
                    )}
                    {ex.targets.rir != null && (
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-500">
                        RIR {ex.targets.rir}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900">{editingId ? t('common.edit') : t('trainer.addExercise')}</h3>

          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.exerciseName')}</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={t('trainer.exerciseName')}
              className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.muscleGroup')}</label>
            <select
              value={form.muscleGroup}
              onChange={e => setForm(f => ({ ...f, muscleGroup: e.target.value }))}
              className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
            >
              <option value="">{t('trainer.muscleGroup')}</option>
              {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.sets')}</label>
              <input type="number" value={form.targets.sets} onChange={e => setTarget('sets', e.target.value)}
                className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.repsMin')}</label>
              <input type="number" value={form.targets.repsMin} onChange={e => setTarget('repsMin', e.target.value)}
                className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.repsMax')}</label>
              <input type="number" value={form.targets.repsMax} onChange={e => setTarget('repsMax', e.target.value)}
                className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.weight')}</label>
              <input type="number" value={form.targets.weight} onChange={e => setTarget('weight', e.target.value)}
                className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.rir')}</label>
              <input type="number" value={form.targets.rir} onChange={e => setTarget('rir', e.target.value)}
                className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.restBetweenSets')}</label>
              <input type="number" value={form.targets.restBetweenSets} onChange={e => setTarget('restBetweenSets', e.target.value)}
                className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.videoUrl')}</label>
            <input
              type="url"
              value={form.videoUrl}
              onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
              placeholder={t('trainer.videoUrl')}
              className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.notes')}</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder={t('trainer.notes')}
              className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="flex-1 p-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold transition-colors shadow-lg shadow-accent/30">
              {t('common.save')}
            </button>
            <button type="button" onClick={resetForm} className="p-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-accent hover:text-accent font-bold transition-colors"
        >
          + {t('trainer.addExercise')}
        </button>
      )}
    </div>
  );
}

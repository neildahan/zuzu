import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkout } from '../../api/workouts';
import { getExercises, createExercise, updateExercise, deleteExercise, reorderExercises } from '../../api/exercises';
import toast from 'react-hot-toast';
import { getExerciseTemplates } from '../../api/exerciseTemplates';
import { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body'];

const LIBRARY_MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];

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
  const { t, i18n } = useTranslation();
  const { id, wid } = useParams();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState('All');
  const [librarySearch, setLibrarySearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyExercise);
  const [errors, setErrors] = useState({});
  const filterScrollRef = useRef(null);

  const { data: workout } = useQuery({
    queryKey: ['workout', wid],
    queryFn: () => getWorkout(wid),
  });

  const { data: exercises } = useQuery({
    queryKey: ['exercises', wid],
    queryFn: () => getExercises(wid),
  });

  const { data: templates } = useQuery({
    queryKey: ['exercise-templates', libraryFilter === 'All' ? undefined : libraryFilter],
    queryFn: () => getExerciseTemplates(libraryFilter === 'All' ? {} : { muscleGroup: libraryFilter }),
    enabled: showLibrary,
  });

  const createMut = useMutation({
    mutationFn: (data) => createExercise(wid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', wid] });
      resetForm();
      toast.success(t('trainer.exerciseAdded') || 'Exercise added');
    },
    onError: () => toast.error(t('admin.actionFailed') || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateExercise(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', wid] });
      resetForm();
      toast.success(t('trainer.exerciseUpdated') || 'Exercise updated');
    },
    onError: () => toast.error(t('admin.actionFailed') || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteExercise(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exercises', wid] }); toast.success(t('trainer.exerciseDeleted') || 'Exercise deleted'); },
    onError: () => toast.error(t('admin.actionFailed') || 'Failed'),
  });

  const reorderMut = useMutation({
    mutationFn: (orderedIds) => reorderExercises(wid, orderedIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises', wid] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sorted = [...(exercises || [])].sort((a, b) => a.order - b.order);
    const oldIndex = sorted.findIndex(e => e._id === active.id);
    const newIndex = sorted.findIndex(e => e._id === over.id);
    const reordered = arrayMove(sorted, oldIndex, newIndex);
    reorderMut.mutate(reordered.map(e => e._id));
  };

  const resetForm = () => {
    setShowForm(false);
    setShowAddChoice(false);
    setEditingId(null);
    setForm(emptyExercise);
    setErrors({});
  };

  const handleEdit = (ex) => {
    setForm({
      name: ex.name,
      nameHe: ex.nameHe || '',
      muscleGroup: ex.muscleGroup || '',
      videoUrl: ex.videoUrl || '',
      notes: ex.notes || '',
      order: ex.order,
      targets: { ...emptyExercise.targets, ...ex.targets },
    });
    setEditingId(ex._id);
    setShowForm(true);
    setShowAddChoice(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = true;
    if (!form.muscleGroup) newErrors.muscleGroup = true;
    if (!form.targets.sets || Number(form.targets.sets) < 1) newErrors.sets = true;
    if (!form.targets.repsMin || Number(form.targets.repsMin) < 1) newErrors.repsMin = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t('admin.fillRequired') || 'Please fill required fields');
      return;
    }
    setErrors({});
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
      order: editingId ? form.order : (exercises?.length || 0),
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

  const handleAddFromLibrary = () => {
    setShowAddChoice(false);
    setShowLibrary(true);
  };

  const handleAddCustom = () => {
    setShowAddChoice(false);
    setShowForm(true);
  };

  const handleSelectTemplate = (template) => {
    const name = (i18n.language === 'he' && template.nameHe) ? template.nameHe : template.name;
    const dt = template.defaultTargets || template.targets || {};
    const data = {
      name,
      nameHe: template.nameHe || '',
      muscleGroup: template.muscleGroup || '',
      videoUrl: template.videoUrl || '',
      notes: template.notes || '',
      notesHe: template.notesHe || '',
      targets: {
        sets: dt.sets || 3,
        repsMin: dt.repsMin || 8,
        repsMax: dt.repsMax || 12,
        weight: dt.weight || '',
        rir: dt.rir ?? 2,
        restBetweenSets: dt.restBetweenSets || 90,
        restAfterExercise: dt.restAfterExercise || 120,
      },
      order: exercises?.length || 0,
    };
    createMut.mutate(data);
    setShowLibrary(false);
  };

  // Prevent body scroll when library panel is open
  useEffect(() => {
    if (showLibrary) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showLibrary]);

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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={(exercises || []).sort((a, b) => a.order - b.order).map(e => e._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {exercises?.sort((a, b) => a.order - b.order).map((ex, i) => (
              editingId === ex._id ? (
                <InlineEditForm
                  key={ex._id}
                  form={form}
                  setForm={setForm}
                  errors={errors}
                  setErrors={setErrors}
                  onSubmit={handleSubmit}
                  onCancel={resetForm}
                  t={t}
                  isHe={i18n.language === 'he'}
                  isPending={updateMut.isPending}
                />
              ) : (
                <SortableExerciseCard
                  key={ex._id}
                  ex={ex}
                  index={i}
                  t={t}
                  isHe={i18n.language === 'he'}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteMut.mutate(id)}
                />
              )
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add form (new exercise only — edits are inline above) */}
      {showForm && !editingId ? (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900">{editingId ? t('common.edit') : t('trainer.addExercise')}</h3>

          <div>
            <label className={`block text-sm font-bold mb-1.5 ${errors.name ? 'text-red-500' : 'text-gray-500'}`}>{i18n.language === 'he' ? 'שם באנגלית' : t('trainer.exerciseName')} *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: false })); }}
              placeholder="Exercise name (English)"
              className={`w-full p-4 rounded-2xl bg-white border ${errors.name ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'} focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium`}
              autoFocus
            />
          </div>

          {i18n.language === 'he' && (
            <div>
              <label className="block text-sm font-bold mb-1.5 text-gray-500">שם בעברית</label>
              <input
                type="text"
                value={form.nameHe || ''}
                onChange={e => setForm(f => ({ ...f, nameHe: e.target.value }))}
                placeholder="שם התרגיל בעברית"
                className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
              />
            </div>
          )}

          <div>
            <label className={`block text-sm font-bold mb-1.5 ${errors.muscleGroup ? 'text-red-500' : 'text-gray-500'}`}>{t('trainer.muscleGroup')} *</label>
            <select
              value={form.muscleGroup}
              onChange={e => { setForm(f => ({ ...f, muscleGroup: e.target.value })); setErrors(er => ({ ...er, muscleGroup: false })); }}
              className={`w-full p-4 rounded-2xl bg-white border ${errors.muscleGroup ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'} focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium`}
            >
              <option value="">{t('trainer.muscleGroup')}</option>
              {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{t('muscle.' + g)}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-bold mb-1.5 ${errors.sets ? 'text-red-500' : 'text-gray-500'}`}>{t('trainer.sets')} *</label>
              <input type="number" value={form.targets.sets} onChange={e => { setTarget('sets', e.target.value); setErrors(er => ({ ...er, sets: false })); }}
                className={`w-full p-4 rounded-2xl bg-white border ${errors.sets ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'} focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium`} />
            </div>
            <div>
              <label className={`block text-sm font-bold mb-1.5 ${errors.repsMin ? 'text-red-500' : 'text-gray-500'}`}>{t('trainer.repsMin')} *</label>
              <input type="number" value={form.targets.repsMin} onChange={e => { setTarget('repsMin', e.target.value); setErrors(er => ({ ...er, repsMin: false })); }}
                className={`w-full p-4 rounded-2xl bg-white border ${errors.repsMin ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'} focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium`} />
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
      ) : showAddChoice ? (
        /* Two-button choice: Library vs Custom */
        <div className="p-5 rounded-2xl bg-white shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-900 text-center">{t('trainer.addExercise')}</h3>
          <button
            onClick={handleAddFromLibrary}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold transition-all hover:shadow-lg flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            {t('trainer.fromLibrary') || 'From Library'}
          </button>
          <button
            onClick={handleAddCustom}
            className="w-full p-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold transition-all hover:border-accent hover:text-accent flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('trainer.createCustom') || 'Create Custom'}
          </button>
          <button
            onClick={() => setShowAddChoice(false)}
            className="w-full p-3 text-gray-400 font-medium text-sm hover:text-gray-600 transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddChoice(true)}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-accent hover:text-accent font-bold transition-colors"
        >
          + {t('trainer.addExercise')}
        </button>
      )}

      {/* Library picker panel - full screen overlay */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
          {/* Header */}
          <div className="shrink-0 px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-extrabold text-white">{t('trainer.exerciseLibrary')}</h3>
              <button
                onClick={() => { setShowLibrary(false); setLibrarySearch(''); }}
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute start-4 top-1/2 -translate-y-1/2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={librarySearch}
                onChange={e => setLibrarySearch(e.target.value)}
                placeholder={t('trainer.searchExercises')}
                className="w-full ps-11 pe-4 py-3 rounded-2xl bg-white/[0.06] border-2 border-white/[0.08] focus:border-accent outline-none font-medium text-white placeholder:text-gray-600 text-base"
              />
            </div>

            {/* Muscle group filter tabs */}
            <div
              ref={filterScrollRef}
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {LIBRARY_MUSCLE_GROUPS.map(group => (
                <button
                  key={group}
                  onClick={() => setLibraryFilter(group)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                    libraryFilter === group
                      ? 'bg-accent text-white'
                      : 'bg-white/[0.06] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {group === 'All' ? t('muscle.all') : t('muscle.' + group)}
                </button>
              ))}
            </div>
          </div>

          {/* Template list */}
          <div className="flex-1 overflow-y-auto px-5 pb-8 pt-3 space-y-2">
            {!templates ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (() => {
              const search = librarySearch.toLowerCase();
              const filtered = search
                ? templates.filter(tp => tp.name.toLowerCase().includes(search) || (tp.nameHe && tp.nameHe.toLowerCase().includes(search)))
                : templates;
              return filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 font-medium">{t('common.noData')}</p>
                </div>
              ) : (
                filtered.map(template => {
                  const displayName = (i18n.language === 'he' && template.nameHe) ? template.nameHe : template.name;
                  const dt = template.defaultTargets || {};
                  return (
                    <button
                      key={template._id}
                      onClick={() => { handleSelectTemplate(template); setLibrarySearch(''); }}
                      className="w-full text-start p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{displayName}</span>
                        <div className="flex items-center gap-2">
                          {template.videoUrl && (
                            <span className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F97316" stroke="none">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </span>
                          )}
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {template.muscleGroup && (
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${MUSCLE_COLORS[template.muscleGroup] || 'bg-gray-100 text-gray-500'}`}>
                            {t('muscle.' + template.muscleGroup)}
                          </span>
                        )}
                        {dt.sets && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {dt.sets}x{dt.repsMin}{dt.repsMax ? `-${dt.repsMax}` : ''}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              );
            })()}
          </div>
        </div>
      )}

      {/* Slide-up animation style */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function SortableExerciseCard({ ex, index, t, isHe, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden ${isDragging ? 'shadow-xl' : ''}`}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical size={18} className="text-gray-400" />
          </button>
          {/* Number badge */}
          <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <span className="font-bold text-lg text-gray-900">{isHe && ex.nameHe ? ex.nameHe : ex.name}</span>
                {isHe && ex.nameHe && <span className="block text-[11px] text-gray-400 font-medium">{ex.name}</span>}
              </div>
              <div className="flex gap-1">
                {ex.videoUrl && (
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-9 h-9 rounded-xl bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#F97316" stroke="none">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </a>
                )}
                <button
                  onClick={() => onEdit(ex)}
                  className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-accent/10 flex items-center justify-center transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button
                  onClick={() => onDelete(ex._id)}
                  className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {ex.muscleGroup && (
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${MUSCLE_COLORS[ex.muscleGroup] || 'bg-gray-100 text-gray-500'}`}>
                  {t('muscle.' + ex.muscleGroup)}
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
  );
}

function InlineEditForm({ form, setForm, errors, setErrors, onSubmit, onCancel, t, isHe, isPending }) {
  const setTarget = (key, value) => setForm(f => ({ ...f, targets: { ...f.targets, [key]: value } }));

  return (
    <form onSubmit={onSubmit} className="p-5 rounded-2xl bg-white shadow-sm border-2 border-accent/30 space-y-4">
      <h3 className="font-bold text-gray-900">{t('common.edit')}</h3>

      <div>
        <label className={`block text-sm font-bold mb-1.5 ${errors.name ? 'text-red-500' : 'text-gray-500'}`}>{isHe ? 'שם באנגלית' : t('trainer.exerciseName')} *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: false })); }}
          placeholder="Exercise name (English)"
          className={`w-full p-4 rounded-2xl bg-white border ${errors.name ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'} focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium`}
          autoFocus
        />
      </div>

      {isHe && (
        <div>
          <label className="block text-sm font-bold mb-1.5 text-gray-500">שם בעברית</label>
          <input
            type="text"
            value={form.nameHe || ''}
            onChange={e => setForm(f => ({ ...f, nameHe: e.target.value }))}
            placeholder="שם התרגיל בעברית"
            className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
          />
        </div>
      )}

      <div>
        <label className={`block text-sm font-bold mb-1.5 ${errors.muscleGroup ? 'text-red-500' : 'text-gray-500'}`}>{t('trainer.muscleGroup')} *</label>
        <select
          value={form.muscleGroup}
          onChange={e => { setForm(f => ({ ...f, muscleGroup: e.target.value })); setErrors(er => ({ ...er, muscleGroup: false })); }}
          className={`w-full p-4 rounded-2xl bg-white border ${errors.muscleGroup ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'} focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium`}
        >
          <option value="">{t('trainer.muscleGroup')}</option>
          {['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body'].map(g => <option key={g} value={g}>{t('muscle.' + g)}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-sm font-bold mb-1.5 ${errors.sets ? 'text-red-500' : 'text-gray-500'}`}>{t('trainer.sets')} *</label>
          <input type="number" value={form.targets.sets} onChange={e => { setTarget('sets', e.target.value); setErrors(er => ({ ...er, sets: false })); }}
            className={`w-full p-4 rounded-2xl bg-white border ${errors.sets ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'} focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium`} />
        </div>
        <div>
          <label className={`block text-sm font-bold mb-1.5 ${errors.repsMin ? 'text-red-500' : 'text-gray-500'}`}>{t('trainer.repsMin')} *</label>
          <input type="number" value={form.targets.repsMin} onChange={e => { setTarget('repsMin', e.target.value); setErrors(er => ({ ...er, repsMin: false })); }}
            className={`w-full p-4 rounded-2xl bg-white border ${errors.repsMin ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'} focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium`} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1.5 text-gray-500">{t('trainer.repsMax')}</label>
          <input type="number" value={form.targets.repsMax} onChange={e => setTarget('repsMax', e.target.value)}
            className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1.5 text-gray-500">{t('trainer.weight')}</label>
          <input type="number" value={form.targets.weight} onChange={e => setTarget('weight', e.target.value)}
            className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1.5 text-gray-500">{t('trainer.rir')}</label>
          <input type="number" value={form.targets.rir} onChange={e => setTarget('rir', e.target.value)}
            className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1.5 text-gray-500">{t('trainer.restBetweenSets')}</label>
          <input type="number" value={form.targets.restBetweenSets} onChange={e => setTarget('restBetweenSets', e.target.value)}
            className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1.5 text-gray-500">{t('trainer.videoUrl')}</label>
        <input type="url" value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
          placeholder={t('trainer.videoUrl')}
          className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium" />
      </div>

      <div>
        <label className="block text-sm font-bold mb-1.5 text-gray-500">{t('trainer.notes')}</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder={t('trainer.notes')}
          className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium" rows={2} />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="flex-1 p-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold transition-colors shadow-lg shadow-accent/30">
          {t('common.save')}
        </button>
        <button type="button" onClick={onCancel} className="p-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors">
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}

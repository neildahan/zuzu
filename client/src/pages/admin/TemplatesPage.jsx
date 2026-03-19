import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExerciseTemplates } from '../../api/exerciseTemplates';
import { createExerciseTemplate, updateExerciseTemplate, deleteExerciseTemplate } from '../../api/admin';
import Dropdown from '../../components/admin/Dropdown';
import toast from 'react-hot-toast';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body'];

export default function TemplatesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [mgFilter, setMgFilter] = useState('');
  const [editTemplate, setEditTemplate] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['exercise-templates'],
    queryFn: () => getExerciseTemplates(),
  });

  const deleteMut = useMutation({
    mutationFn: deleteExerciseTemplate,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exercise-templates'] }); toast.success(t('admin.templateDeleted')); },
    onError: () => toast.error(t('admin.actionFailed')),
  });

  const createMut = useMutation({
    mutationFn: createExerciseTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-templates'] });
      setShowAdd(false);
      toast.success(t('admin.templateCreated'));
    },
    onError: () => toast.error(t('admin.actionFailed')),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }) => updateExerciseTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-templates'] });
      setEditTemplate(null);
      toast.success(t('admin.templateUpdated'));
    },
    onError: () => toast.error(t('admin.actionFailed')),
  });

  const q = search.toLowerCase();
  const filtered = (templates || []).filter((t) => {
    if (mgFilter && t.muscleGroup !== mgFilter) return false;
    if (q && !t.name.toLowerCase().includes(q) && !(t.nameHe || '').toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{t('admin.templates')}</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-xl bg-accent text-white font-bold text-sm"
        >
          + {t('admin.addTemplate')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.searchTemplates')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-accent/30"
        />
        <Dropdown
          value={mgFilter}
          onChange={setMgFilter}
          options={[
            { value: '', label: t('muscle.all') },
            ...MUSCLE_GROUPS.map((mg) => ({ value: mg, label: t(`muscle.${mg}`) })),
          ]}
          placeholder={t('muscle.all')}
          className="sm:w-48"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.name')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.nameHe')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('trainer.muscleGroup')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('trainer.sets')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('client.reps')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((tpl) => (
                  <tr key={tpl._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold">{tpl.name}</td>
                    <td className="px-4 py-3 text-gray-500">{tpl.nameHe || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {t(`muscle.${tpl.muscleGroup}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{tpl.defaultTargets?.sets || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {tpl.defaultTargets?.repsMin}{tpl.defaultTargets?.repsMax ? `–${tpl.defaultTargets.repsMax}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditTemplate(tpl)} className="text-xs font-bold text-accent hover:underline">
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => { if (window.confirm(t('admin.confirmDelete'))) deleteMut.mutate(tpl._id); }}
                          className="text-xs font-bold text-red-500 hover:underline"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t('admin.noResults')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAdd || editTemplate) && (
        <TemplateModal
          template={editTemplate}
          onClose={() => { setShowAdd(false); setEditTemplate(null); }}
          onSave={(data) => {
            if (editTemplate) {
              updateMut.mutate({ id: editTemplate._id, ...data });
            } else {
              createMut.mutate(data);
            }
          }}
          isPending={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

function TemplateModal({ template, onClose, onSave, isPending }) {
  const { t } = useTranslation();
  const [muscleGroup, setMuscleGroup] = useState(template?.muscleGroup || '');

  const mgOptions = MUSCLE_GROUPS.map((mg) => ({ value: mg, label: t(`muscle.${mg}`) }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">{template ? t('admin.editTemplate') : t('admin.addTemplate')}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            onSave({
              name: fd.get('name'),
              nameHe: fd.get('nameHe') || undefined,
              muscleGroup,
              videoUrl: fd.get('videoUrl') || undefined,
              notes: fd.get('notes') || undefined,
              notesHe: fd.get('notesHe') || undefined,
              defaultTargets: {
                sets: Number(fd.get('sets')) || 3,
                repsMin: Number(fd.get('repsMin')) || 8,
                repsMax: Number(fd.get('repsMax')) || undefined,
                restBetweenSets: Number(fd.get('restBetweenSets')) || 90,
                restAfterExercise: Number(fd.get('restAfterExercise')) || 120,
              },
            });
          }}
          className="space-y-3"
        >
          <input name="name" defaultValue={template?.name} placeholder={t('trainer.exerciseName')} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
          <input name="nameHe" defaultValue={template?.nameHe} placeholder={t('admin.nameHe')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
          <Dropdown value={muscleGroup} onChange={setMuscleGroup} options={mgOptions} placeholder={t('trainer.muscleGroup')} />
          <div className="grid grid-cols-3 gap-3">
            <input name="sets" type="number" defaultValue={template?.defaultTargets?.sets || 3} placeholder={t('trainer.sets')} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
            <input name="repsMin" type="number" defaultValue={template?.defaultTargets?.repsMin || 8} placeholder={t('trainer.repsMin')} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
            <input name="repsMax" type="number" defaultValue={template?.defaultTargets?.repsMax} placeholder={t('trainer.repsMax')} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input name="restBetweenSets" type="number" defaultValue={template?.defaultTargets?.restBetweenSets || 90} placeholder={t('trainer.restBetweenSets')} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
            <input name="restAfterExercise" type="number" defaultValue={template?.defaultTargets?.restAfterExercise || 120} placeholder={t('trainer.restAfterExercise')} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <input name="videoUrl" defaultValue={template?.videoUrl} placeholder={t('trainer.videoUrl')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
          <input name="notes" defaultValue={template?.notes} placeholder={t('trainer.notes')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
          <input name="notesHe" defaultValue={template?.notesHe} placeholder={t('admin.notesHe')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold text-sm">
              {t('common.save')}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

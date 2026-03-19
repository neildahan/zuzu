import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProgram, updateProgram, deleteProgram } from '../../api/programs';
import { getWorkouts, createWorkout, deleteWorkout, duplicateWorkout } from '../../api/workouts';
import { useState } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import toast from 'react-hot-toast';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ProgramEditor() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showEditProgram, setShowEditProgram] = useState(false);
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

  const deleteWorkoutMut = useMutation({
    mutationFn: (workoutId) => deleteWorkout(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', id] });
      toast.success(t('trainer.workoutDeleted') || 'Workout deleted');
    },
  });

  const duplicateMut = useMutation({
    mutationFn: (workoutId) => duplicateWorkout(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', id] });
      toast.success(t('trainer.workoutDuplicated') || 'Workout duplicated');
    },
    onError: () => toast.error(t('admin.actionFailed') || 'Failed'),
  });

  const updateProgramMut = useMutation({
    mutationFn: (data) => updateProgram(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setShowEditProgram(false);
    },
  });

  const deleteProgramMut = useMutation({
    mutationFn: () => deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      navigate(-1);
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
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-accent uppercase tracking-widest">
            {program.weekCount === 1 ? (i18n.language === 'he' ? 'תוכנית שבועית חוזרת' : 'Repeating Weekly') : 'Program'}
          </span>
          <button
            onClick={() => setShowEditProgram(true)}
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
        <h2 className="text-2xl font-extrabold mt-1">{program.name}</h2>
        {program.description && <p className="text-sm text-gray-400 mt-1">{program.description}</p>}
        <div className="flex gap-6 mt-4">
          <div>
            <span className="text-2xl font-extrabold">{program.weekCount === 1 ? '∞' : program.weekCount}</span>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
              {program.weekCount === 1 ? (i18n.language === 'he' ? 'חוזר' : 'Repeat') : t('trainer.weeks')}
            </p>
          </div>
          <div>
            <span className="text-2xl font-extrabold">{workouts?.length || 0}</span>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{t('nav.workouts')}</p>
          </div>
          <div>
            <span className={`text-2xl font-extrabold ${program.isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
              {program.isActive ? '●' : '○'}
            </span>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{t('trainer.active')}</p>
          </div>
        </div>
      </div>

      {/* Edit program panel */}
      {showEditProgram && (
        <div className="p-5 rounded-2xl bg-white shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900">{t('trainer.editProgram')}</h3>
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.programName')}</label>
            <input
              type="text"
              defaultValue={program.name}
              id="edit-program-name"
              className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.description')}</label>
            <textarea
              defaultValue={program.description || ''}
              id="edit-program-desc"
              rows={2}
              className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium text-base"
            />
          </div>
          {/* Repeat toggle */}
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">
              {i18n.language === 'he' ? 'סוג תוכנית' : 'Plan Type'}
            </label>
            <div className="flex bg-gray-100 rounded-2xl p-1">
              <button
                type="button"
                id="edit-program-repeat-btn"
                onClick={(e) => {
                  const weeksInput = document.getElementById('edit-program-weeks');
                  const btn = e.currentTarget;
                  const fixedBtn = document.getElementById('edit-program-fixed-btn');
                  btn.className = 'flex-1 py-3 rounded-xl text-sm font-bold bg-white text-gray-900 shadow-sm';
                  fixedBtn.className = 'flex-1 py-3 rounded-xl text-sm font-bold text-gray-400';
                  weeksInput.value = '1';
                  document.getElementById('edit-program-weeks-row').style.display = 'none';
                }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold ${program.weekCount === 1 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                {i18n.language === 'he' ? 'חוזר ∞' : 'Repeating ∞'}
              </button>
              <button
                type="button"
                id="edit-program-fixed-btn"
                onClick={(e) => {
                  const weeksInput = document.getElementById('edit-program-weeks');
                  const btn = e.currentTarget;
                  const repeatBtn = document.getElementById('edit-program-repeat-btn');
                  btn.className = 'flex-1 py-3 rounded-xl text-sm font-bold bg-white text-gray-900 shadow-sm';
                  repeatBtn.className = 'flex-1 py-3 rounded-xl text-sm font-bold text-gray-400';
                  if (weeksInput.value === '1') weeksInput.value = '4';
                  document.getElementById('edit-program-weeks-row').style.display = '';
                }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold ${program.weekCount > 1 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                {i18n.language === 'he' ? 'מספר שבועות' : 'Fixed Weeks'}
              </button>
            </div>
          </div>

          <div id="edit-program-weeks-row" style={{ display: program.weekCount === 1 ? 'none' : '' }}>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.weeks')}</label>
            <input
              type="number"
              min={2}
              max={52}
              defaultValue={program.weekCount === 1 ? 4 : program.weekCount}
              id="edit-program-weeks"
              className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.active')}</label>
              <button
                id="edit-program-active"
                onClick={(e) => {
                  const btn = e.currentTarget;
                  btn.dataset.active = btn.dataset.active === 'true' ? 'false' : 'true';
                  btn.textContent = btn.dataset.active === 'true'
                    ? (i18n.language === 'he' ? 'פעיל ●' : 'Active ●')
                    : (i18n.language === 'he' ? 'לא פעיל ○' : 'Inactive ○');
                  btn.className = btn.dataset.active === 'true'
                    ? 'w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold text-base'
                    : 'w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-400 font-bold text-base';
                }}
                data-active={program.isActive ? 'true' : 'false'}
                className={`w-full p-4 rounded-2xl border font-bold text-base ${
                  program.isActive
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                {program.isActive
                  ? (i18n.language === 'he' ? 'פעיל ●' : 'Active ●')
                  : (i18n.language === 'he' ? 'לא פעיל ○' : 'Inactive ○')}
              </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const name = document.getElementById('edit-program-name').value;
                const description = document.getElementById('edit-program-desc').value;
                const weeksRow = document.getElementById('edit-program-weeks-row');
                const isRepeating = weeksRow.style.display === 'none';
                const weekCount = isRepeating ? 1 : Number(document.getElementById('edit-program-weeks').value);
                const isActive = document.getElementById('edit-program-active').dataset.active === 'true';
                updateProgramMut.mutate({ name, description: description || undefined, weekCount, isActive });
              }}
              disabled={updateProgramMut.isPending}
              className="flex-1 p-4 rounded-2xl bg-accent text-white font-bold shadow-lg shadow-accent/30 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {t('common.save')}
            </button>
            <button
              onClick={() => setShowEditProgram(false)}
              className="p-4 rounded-2xl bg-gray-100 text-gray-600 font-bold active:scale-[0.98] transition-transform"
            >
              {t('common.cancel')}
            </button>
          </div>

          <button
            onClick={() => {
              if (confirm(i18n.language === 'he' ? 'למחוק את התוכנית?' : 'Delete this program?')) {
                deleteProgramMut.mutate();
              }
            }}
            className="w-full p-3 rounded-2xl bg-red-50 text-red-500 font-bold text-sm active:scale-[0.98] transition-transform"
          >
            {t('common.delete')} {t('trainer.editProgram').toLowerCase()}
          </button>
        </div>
      )}

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
        {workouts?.sort((a, b) => a.order - b.order).map(workout => (
          <WorkoutCard
            key={workout._id}
            workout={workout}
            programId={id}
            t={t}
            i18n={i18n}
            onDuplicate={() => duplicateMut.mutate(workout._id)}
            onDelete={() => {
              if (confirm(i18n.language === 'he' ? `למחוק את ${workout.name}?` : `Delete ${workout.name}?`)) {
                deleteWorkoutMut.mutate(workout._id);
              }
            }}
          />
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
                {[0,1,2,3,4,5,6].map(i => <option key={i} value={i}>{t('days.' + i)}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-500 mb-1.5">Type</label>
              <select
                value={newWorkout.type}
                onChange={e => setNewWorkout(w => ({ ...w, type: e.target.value }))}
                className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
              >
                <option value="strength">{t('workoutType.strength')}</option>
                <option value="cardio">{t('workoutType.cardio')}</option>
                <option value="hybrid">{t('workoutType.hybrid')}</option>
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

const TYPE_STRIP = {
  strength: 'bg-accent',
  cardio: 'bg-blue-500',
  hybrid: 'bg-purple-500',
};

const TYPE_COLORS_CARD = {
  strength: 'bg-accent/10 text-accent border-accent/20',
  cardio: 'bg-blue-50 text-blue-500 border-blue-100',
  hybrid: 'bg-purple-50 text-purple-500 border-purple-100',
};

function WorkoutCard({ workout, programId, t, i18n, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => setOpen(true),
    onSwipedRight: () => setOpen(false),
    trackMouse: false,
    preventScrollOnSwipe: true,
    delta: 30,
  });

  return (
    <div {...handlers}>
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100">
        <div className="flex">
          <div className={`w-1.5 rounded-s-2xl ${TYPE_STRIP[workout.type] || 'bg-gray-300'}`} />
          <Link
            to={`/trainer/program/${programId}/workout/${workout._id}`}
            onClick={(e) => { if (open) { e.preventDefault(); setOpen(false); } }}
            className="flex-1 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <span className="font-bold text-lg text-gray-900">{workout.name}</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                    {t('days.' + workout.dayOfWeek)}
                  </span>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${TYPE_COLORS_CARD[workout.type] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {t('workoutType.' + workout.type)}
                  </span>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180 shrink-0"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
          </Link>
        </div>

        {/* Action row — slides open */}
        <div className={`overflow-hidden transition-all duration-200 ease-out ${open ? 'max-h-14' : 'max-h-0'}`}>
          <div className="flex border-t border-gray-100">
            <button
              onClick={() => { onDuplicate(); setOpen(false); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Copy size={15} />
              {t('trainer.duplicate')}
            </button>
            <div className="w-px bg-gray-100" />
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={15} />
              {t('common.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

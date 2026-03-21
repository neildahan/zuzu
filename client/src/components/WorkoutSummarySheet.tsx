import { useTranslation } from 'react-i18next';
import { Dumbbell } from 'lucide-react';

export default function WorkoutSummarySheet({ exercises, exerciseLogs, elapsed, onFinish, onKeepGoing, isPending }) {
  const { t, i18n } = useTranslation();
  const isHe = i18n.language === 'he';

  const secs = elapsed % 60;
  const totalMins = Math.floor(elapsed / 60);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  const allSets = Object.values(exerciseLogs).flat();
  const completedSets = allSets.filter(s => s.isCompleted);
  const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60" onClick={onKeepGoing}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-5 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto" />
        <h3 className="text-xl font-black text-center">{t('client.workoutSummary')}</h3>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-gray-900 text-white text-center">
            <span className="text-2xl font-black">
              {hrs > 0 && `${hrs}:`}{mins}:{secs.toString().padStart(2, '0')}
            </span>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{t('client.workoutDuration')}</p>
          </div>
          <div className="p-4 rounded-2xl bg-accent text-white text-center">
            <span className="text-2xl font-black">{completedSets.length}/{allSets.length}</span>
            <p className="text-[10px] font-bold text-white/70 uppercase mt-1">{t('trainer.sets')}</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-center">
            <span className="text-2xl font-black">{totalVolume > 999 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}</span>
            <p className="text-[10px] font-bold text-white/70 uppercase mt-1">{t('history.vol')}</p>
          </div>
        </div>

        {/* Per-exercise summary */}
        <div className="space-y-2">
          {exercises.map(ex => {
            const sets = exerciseLogs[ex._id] || [];
            const done = sets.filter(s => s.isCompleted).length;
            const exName = isHe && ex.nameHe ? ex.nameHe : ex.name;
            return (
              <div key={ex._id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2 min-w-0">
                  <Dumbbell size={14} className="text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-semibold truncate block">{exName}</span>
                    {isHe && ex.nameHe && <span className="text-[10px] text-gray-400 block">{ex.name}</span>}
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  done === sets.length && done > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  {done}/{sets.length}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onFinish}
            disabled={isPending}
            className="flex-1 p-4 rounded-2xl bg-accent text-white font-bold active:scale-[0.98] transition-transform shadow-lg shadow-accent/30 disabled:opacity-50"
          >
            {isPending ? '...' : t('client.saveAndFinish')}
          </button>
          <button
            onClick={onKeepGoing}
            className="p-4 rounded-2xl bg-gray-100 text-gray-600 font-bold"
          >
            {t('client.keepGoing')}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}

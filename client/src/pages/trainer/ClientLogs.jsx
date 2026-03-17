import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUser } from '../../api/users';
import { getWorkoutLogs } from '../../api/workoutLogs';

export default function ClientLogs() {
  const { t } = useTranslation();
  const { cid } = useParams();

  const { data: client } = useQuery({
    queryKey: ['user', cid],
    queryFn: () => getUser(cid),
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['workout-logs', { clientId: cid }],
    queryFn: () => getWorkoutLogs({ clientId: cid }),
  });

  if (isLoading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 text-white">
        <span className="text-[11px] font-bold text-accent uppercase tracking-widest">{t('trainer.clientLogs')}</span>
        <h2 className="text-2xl font-extrabold mt-1">{client?.name}</h2>
        <div className="mt-3">
          <span className="text-2xl font-extrabold">{logs?.length || 0}</span>
          <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Total Sessions</p>
        </div>
      </div>

      {!logs?.length ? (
        <div className="p-12 rounded-2xl bg-white shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <p className="text-gray-400 font-medium">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log._id} className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex">
                {/* Status strip */}
                <div className={`w-1.5 ${log.isCompleted ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <div className="flex-1 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${log.isCompleted ? 'bg-emerald-50' : 'bg-gray-50'} flex items-center justify-center`}>
                        {log.isCompleted ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900">
                          {t('common.week')} {log.weekNumber}
                        </span>
                        <span className="block text-[11px] text-gray-400 font-medium mt-0.5">
                          {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                        log.isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {log.isCompleted ? t('client.completed') : 'In progress'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                      {log.exercises?.length || 0} {t('trainer.exercises').toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

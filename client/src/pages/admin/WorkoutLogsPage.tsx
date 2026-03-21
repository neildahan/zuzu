import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getAdminWorkoutLogs } from '../../api/admin';

export default function WorkoutLogsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'workout-logs', { page }],
    queryFn: () => getAdminWorkoutLogs({ page, limit: 30 }),
  });

  const logs = data?.logs || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{t('admin.workoutLogs')}</h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-start px-4 py-3 font-bold text-gray-500">{t('roles.client')}</th>
                    <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.program')}</th>
                    <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.date')}</th>
                    <th className="text-start px-4 py-3 font-bold text-gray-500">{t('common.week')}</th>
                    <th className="text-start px-4 py-3 font-bold text-gray-500">{t('trainer.exercises')}</th>
                    <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold">{log.clientId?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{log.programId?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{log.weekNumber}</td>
                      <td className="px-4 py-3 text-gray-500">{log.exercises?.length || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          log.isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {log.isCompleted ? t('client.completed') : t('common.inProgress')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t('admin.noResults')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold disabled:opacity-40"
              >
                ←
              </button>
              <span className="text-sm text-gray-500">{page} / {data.totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold disabled:opacity-40"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

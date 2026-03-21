import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getAdminPrograms } from '../../api/admin';

export default function ProgramsPage() {
  const { t } = useTranslation();

  const { data: programs, isLoading } = useQuery({
    queryKey: ['admin', 'programs'],
    queryFn: getAdminPrograms,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{t('admin.programs')}</h1>

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
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('roles.trainer')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('roles.client')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('trainer.weeks')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.status')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.created')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(programs || []).map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.trainerId?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.clientId?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.weekCount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        p.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {p.isActive ? t('trainer.active') : t('admin.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!programs || programs.length === 0) && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t('admin.noResults')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

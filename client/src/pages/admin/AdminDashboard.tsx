import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '../../api/admin';
import { Users, UserCheck, FolderOpen, CheckCircle, BarChart3, Dumbbell } from 'lucide-react';

const STATS = [
  { key: 'clients', label: 'admin.totalClients', color: 'bg-accent', Icon: Users },
  { key: 'trainers', label: 'admin.totalTrainers', color: 'bg-blue-500', Icon: UserCheck },
  { key: 'programs', label: 'admin.totalPrograms', color: 'bg-purple-500', Icon: FolderOpen },
  { key: 'activePrograms', label: 'admin.activePrograms', color: 'bg-emerald-500', Icon: CheckCircle },
  { key: 'completedLogs', label: 'admin.completedSessions', color: 'bg-gray-800', Icon: BarChart3 },
  { key: 'templates', label: 'admin.totalTemplates', color: 'bg-cyan-500', Icon: Dumbbell },
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black">{t('admin.dashboard')}</h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {STATS.map((s) => (
            <div key={s.key} className={`${s.color} rounded-2xl p-5 text-white`}>
              <div className="flex items-center justify-between mb-3">
                <s.Icon size={24} className="opacity-70" />
              </div>
              <span className="text-3xl font-black">{stats?.[s.key] ?? 0}</span>
              <p className="text-sm font-semibold text-white/70 mt-1">{t(s.label)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

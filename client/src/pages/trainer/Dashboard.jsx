import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUser } from '../../api/users';
import { getPrograms } from '../../api/programs';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const AVATAR_COLORS = ['bg-accent', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);

  const { data: myClients, isLoading } = useQuery({
    queryKey: ['users', { role: 'client', trainerId: user._id }],
    queryFn: () => getUsers({ role: 'client', trainerId: user._id }),
  });

  const { data: allClients } = useQuery({
    queryKey: ['users', { role: 'client' }],
    queryFn: () => getUsers({ role: 'client' }),
    enabled: showPicker,
  });

  const { data: programs } = useQuery({
    queryKey: ['programs', { trainerId: user._id }],
    queryFn: () => getPrograms({ trainerId: user._id }),
  });

  const assignMut = useMutation({
    mutationFn: (clientId) => updateUser(clientId, { trainerId: user._id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowPicker(false);
    },
  });

  const availableClients = allClients?.filter(c => c.trainerId !== user._id) || [];

  if (isLoading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-accent text-white text-center">
          <span className="text-2xl font-extrabold">{myClients?.length || 0}</span>
          <p className="text-[11px] font-semibold text-white/70 mt-0.5">{t('trainer.myClients')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-blue-500 text-white text-center">
          <span className="text-2xl font-extrabold">{programs?.length || 0}</span>
          <p className="text-[11px] font-semibold text-white/70 mt-0.5">{t('trainer.programs') || 'Programs'}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gray-900 text-white text-center">
          <span className="text-2xl font-extrabold">{programs?.filter(p => p.isActive).length || 0}</span>
          <p className="text-[11px] font-semibold text-white/70 mt-0.5">{t('trainer.active') || 'Active'}</p>
        </div>
      </div>

      {/* Clients section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">{t('trainer.myClients')}</h2>
        <span className="text-[11px] font-bold text-gray-400">{myClients?.length || 0} total</span>
      </div>

      {myClients?.length > 0 ? (
        <div className="space-y-3">
          {myClients.map(client => {
            const clientPrograms = programs?.filter(p => p.clientId === client._id) || [];
            const activePrograms = clientPrograms.filter(p => p.isActive);
            return (
              <div key={client._id} className="p-5 rounded-2xl bg-white shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${getAvatarColor(client.name)} flex items-center justify-center text-white font-extrabold text-xl shrink-0`}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">{client.name}</span>
                      <Link
                        to={`/trainer/client/${client._id}/logs`}
                        className="text-xs font-bold text-accent"
                      >
                        {t('trainer.clientLogs')}
                      </Link>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {clientPrograms.length} {(t('trainer.programs') || 'programs').toLowerCase()}
                      </span>
                      {activePrograms.length > 0 && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                          {activePrograms.length} {t('trainer.active') || 'active'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Programs list */}
                {clientPrograms.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {clientPrograms.map(p => (
                      <Link
                        key={p._id}
                        to={`/trainer/program/${p._id}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {p.isActive && <div className="w-2 h-2 rounded-full bg-accent" />}
                          <span className="text-sm font-semibold text-gray-700">{p.name}</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><polyline points="9 18 15 12 9 6" /></svg>
                      </Link>
                    ))}
                  </div>
                )}

                <Link
                  to={`/trainer/program/new?clientId=${client._id}`}
                  className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-accent hover:text-accent-hover"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  {t('trainer.newProgram')}
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </div>
          <p className="text-gray-400 font-medium">{t('trainer.noClients')}</p>
        </div>
      )}

      {/* Add client picker */}
      {showPicker ? (
        <div className="p-5 rounded-2xl bg-white shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-900">{t('trainer.addClient')}</h3>
          {availableClients.length > 0 ? (
            <div className="space-y-2">
              {availableClients.map(client => (
                <button
                  key={client._id}
                  onClick={() => assignMut.mutate(client._id)}
                  disabled={assignMut.isPending}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-accent/5 border border-gray-200 hover:border-accent/30 transition-all font-medium"
                >
                  <div className={`w-10 h-10 rounded-xl ${getAvatarColor(client.name)} flex items-center justify-center text-white font-bold shrink-0`}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-start font-semibold">{client.name}</span>
                  <span className="text-accent font-extrabold text-lg">+</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">{t('trainer.noAvailableClients') || 'No available clients'}</p>
          )}
          <button
            onClick={() => setShowPicker(false)}
            className="w-full p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full p-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold transition-colors shadow-lg shadow-accent/30"
        >
          + {t('trainer.addClient')}
        </button>
      )}
    </div>
  );
}

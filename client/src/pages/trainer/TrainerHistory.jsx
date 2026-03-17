import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../api/users';
import HistoryContent from '../../components/history/HistoryContent';

const AVATAR_COLORS = ['bg-accent', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function TrainerHistory() {
  const { t } = useTranslation();
  const { user } = useUser();
  const [selectedClient, setSelectedClient] = useState(null);

  const { data: clients, isLoading } = useQuery({
    queryKey: ['users', { role: 'client', trainerId: user._id }],
    queryFn: () => getUsers({ role: 'client', trainerId: user._id }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">{t('history.title')}</h1>

      {/* Client picker */}
      <div>
        <p className="text-xs font-bold text-gray-400 mb-2">{t('history.selectClient')}</p>
        <div className="flex gap-3 overflow-x-auto py-2 -mx-1 px-1">
          {clients?.map((client) => (
            <button
              key={client._id}
              onClick={() => setSelectedClient(client._id === selectedClient ? null : client._id)}
              className={`flex flex-col items-center gap-1.5 shrink-0 transition-all ${
                selectedClient === client._id ? 'scale-105' : 'opacity-60'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl ${getAvatarColor(client.name)} flex items-center justify-center text-white font-extrabold text-xl ${
                  selectedClient === client._id ? 'ring-2 ring-accent ring-offset-2' : ''
                }`}
              >
                {client.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[11px] font-semibold text-gray-600 max-w-[60px] truncate">
                {client.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedClient ? (
        <HistoryContent clientId={selectedClient} />
      ) : (
        <div className="p-8 rounded-2xl bg-white shadow-sm border border-gray-100 text-center">
          <p className="text-gray-400 font-medium">{t('history.selectClient')}</p>
        </div>
      )}
    </div>
  );
}

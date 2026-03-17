import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useQuery } from '@tanstack/react-query';
import { getUsers, createUser } from '../api/users';
import { useState } from 'react';
import zuzuLogo from '../assets/zuzu_logo.png';

const AVATAR_COLORS = [
  'from-orange-400 to-orange-600',
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-cyan-400 to-cyan-600',
];

function getAvatarGradient(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function RolePicker() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [activeTab, setActiveTab] = useState('trainer');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'he' : 'en';
    i18n.changeLanguage(newLang);
  };

  const { data: trainers = [] } = useQuery({
    queryKey: ['users', { role: 'trainer' }],
    queryFn: () => getUsers({ role: 'trainer' }),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['users', { role: 'client' }],
    queryFn: () => getUsers({ role: 'client' }),
  });

  const users = activeTab === 'trainer' ? trainers : clients;

  const handleSelectUser = (user) => {
    setUser(user);
    if (user.role === 'trainer') navigate('/trainer');
    else navigate(`/client/${user._id}`);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const trainerId = activeTab === 'client' && trainers.length ? trainers[0]._id : undefined;
    const user = await createUser({ name: name.trim(), role: activeTab, trainerId });
    handleSelectUser(user);
  };

  return (
    <div className="-mx-4 -mt-1 min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-900 flex flex-col">
      {/* Language toggle */}
      <div className="flex justify-end px-5 pt-4">
        <button onClick={toggleLanguage} className="text-xs font-semibold text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-full bg-white/[0.08]">
          {t('language.toggle')}
        </button>
      </div>

      {/* Logo */}
      <div className="text-center pt-8 pb-6">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-white shadow-xl flex items-center justify-center mb-4">
          <img src={zuzuLogo} alt="Zuzu" className="h-16 w-16 object-contain" />
        </div>
        <p className="text-gray-500 text-sm font-medium">{t('roles.pickRole')}</p>
      </div>

      {/* Content area with rounded top */}
      <div className="flex-1 bg-gray-50 rounded-t-[32px] px-5 pt-6 pb-8">
        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => { setActiveTab('trainer'); setCreating(false); setName(''); }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'trainer'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400'
            }`}
          >
            {t('roles.trainer')}
          </button>
          <button
            onClick={() => { setActiveTab('client'); setCreating(false); setName(''); }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'client'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400'
            }`}
          >
            {t('roles.client')}
          </button>
        </div>

        {/* User list */}
        <div className="space-y-3 mb-6">
          {users.length === 0 && !creating && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <p className="text-gray-400 font-medium text-sm">
                {activeTab === 'trainer' ? t('trainer.noClients') : t('common.noData')}
              </p>
            </div>
          )}

          {users.map(u => (
            <button
              key={u._id}
              onClick={() => handleSelectUser(u)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(u.name)} flex items-center justify-center text-white font-black text-lg shadow-sm`}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-start flex-1 min-w-0">
                <span className="font-bold text-gray-900 block truncate">{u.name}</span>
                <span className="text-[11px] font-semibold text-gray-400">{activeTab === 'trainer' ? t('roles.trainer') : t('roles.client')}</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          ))}
        </div>

        {/* Create new */}
        {creating ? (
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder={activeTab === 'trainer' ? t('login.enterTrainerName') : t('login.enterClientName')}
              className="w-full p-4 rounded-2xl bg-white border-2 border-gray-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-semibold text-gray-900 placeholder:text-gray-300"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 p-4 rounded-2xl bg-accent text-white font-bold shadow-lg shadow-accent/25 active:scale-[0.98] transition-transform"
              >
                {t('common.save')}
              </button>
              <button
                onClick={() => { setCreating(false); setName(''); }}
                className="px-6 py-4 rounded-2xl bg-gray-100 text-gray-500 font-bold active:scale-[0.98] transition-transform"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full p-4 rounded-2xl bg-accent text-white font-bold shadow-lg shadow-accent/25 active:scale-[0.98] transition-transform"
          >
            + {activeTab === 'trainer' ? t('roles.trainer') : t('roles.client')}
          </button>
        )}
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function TopBar() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'he' : 'en';
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const isHome = location.pathname === '/trainer' || /^\/client\/[^/]+$/.test(location.pathname);

  if (isHome && user) {
    const today = new Date();
    const dateStr = today.toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    const initial = user.name.charAt(0).toUpperCase();

    return (
      <header className="relative z-50">
        <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800">
          <div className="max-w-lg mx-auto px-5 pt-5 pb-8">
            {/* Top row: date + actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span className="text-xs font-semibold uppercase tracking-wider">{dateStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-white/[0.08] backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
              </div>
            </div>

            {/* User greeting */}
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/profile')} className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-accent/20 ring-2 ring-white/20 overflow-hidden shrink-0">
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : initial}
              </button>
              <div className="flex-1">
                <h1 className="text-[26px] font-black text-white leading-tight">
                  {i18n.language === 'he' ? `שלום, ${user.name}!` : `Hello, ${user.name}!`}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                    {user.role === 'trainer'
                      ? (i18n.language === 'he' ? (user.gender === 'female' ? 'מאמנת' : 'מאמן') : 'Trainer')
                      : (i18n.language === 'he' ? (user.gender === 'female' ? 'מתאמנת' : 'מתאמן') : 'Client')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Curved transition to content */}
        <div className="h-5 bg-gray-50 -mt-5 rounded-t-[28px] relative z-10" />
      </header>
    );
  }

  // Sub-page: clean white bar with back
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/50">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-12">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="w-9" />
      </div>
    </header>
  );
}

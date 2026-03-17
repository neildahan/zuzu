import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { login as loginApi } from '../api/auth';
import { useEffect, useState } from 'react';
import zuzuLogo from '../assets/zuzu_logo.png';

export default function Welcome() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'trainer') navigate('/trainer', { replace: true });
      else navigate(`/client/${user._id}`, { replace: true });
    }
  }, [user, navigate]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'he' : 'en';
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await loginApi(form);
      setUser(u);
      if (u.role === 'trainer') navigate('/trainer', { replace: true });
      else navigate(`/client/${u._id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || (i18n.language === 'he' ? 'אימייל או סיסמה שגויים' : 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      {/* White top — logo takes up ~45% */}
      <div className="bg-white flex flex-col items-center justify-center" style={{ height: '45dvh' }}>
        <div className="absolute top-3 right-3">
          <button onClick={toggleLanguage} className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-3 py-1 rounded-full bg-gray-100">
            {t('language.toggle')}
          </button>
        </div>
        <img src={zuzuLogo} alt="Zuzu" className="max-h-[60%] object-contain" />
        <p className="text-gray-400 text-lg font-bold mt-2">
          {i18n.language === 'he' ? 'הפלטפורמה שלך לאימונים' : 'Your Workout Platform'}
        </p>
      </div>

      {/* Dark bottom — form takes up ~55% */}
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black rounded-t-[32px] -mt-5 relative z-10 px-6 flex flex-col justify-center">
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder={i18n.language === 'he' ? 'אימייל' : 'Email'}
            className="w-full p-3.5 rounded-2xl bg-white/[0.06] border-2 border-white/[0.08] focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium text-white placeholder:text-gray-500"
            required
            autoComplete="email"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={i18n.language === 'he' ? 'סיסמה' : 'Password'}
              className="w-full p-3.5 pe-12 rounded-2xl bg-white/[0.06] border-2 border-white/[0.08] focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium text-white placeholder:text-gray-500"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute end-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300"
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm font-semibold text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3.5 rounded-2xl bg-accent text-white font-bold text-base shadow-lg shadow-accent/25 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              i18n.language === 'he' ? 'התחברות' : 'Login'
            )}
          </button>
        </form>

        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            {i18n.language === 'he' ? 'אין לך חשבון?' : "Don't have an account?"}{' '}
            <button onClick={() => navigate('/register')} className="text-accent font-bold">
              {i18n.language === 'he' ? 'הרשמה' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

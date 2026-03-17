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
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* White top — logo */}
      <div className="bg-white">
        <div className="flex justify-end px-5 pt-5">
          <button onClick={toggleLanguage} className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-full bg-gray-100">
            {t('language.toggle')}
          </button>
        </div>
        <div className="flex flex-col items-center pt-4 pb-14">
          <img src={zuzuLogo} alt="Zuzu" className="h-56 object-contain" />
          <p className="text-gray-400 text-xl font-bold mt-3">
            {i18n.language === 'he' ? 'הפלטפורמה שלך לאימונים' : 'Your Workout Platform'}
          </p>
        </div>
      </div>

      {/* Dark bottom — login form + buttons */}
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black rounded-t-[32px] -mt-6 relative z-10 px-6 pt-8 pb-8 flex flex-col">
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder={i18n.language === 'he' ? 'אימייל' : 'Email'}
            className="w-full p-4 rounded-2xl bg-white/[0.06] border-2 border-white/[0.08] focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium text-white placeholder:text-gray-500"
            required
            autoComplete="email"
          />
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder={i18n.language === 'he' ? 'סיסמה' : 'Password'}
            className="w-full p-4 rounded-2xl bg-white/[0.06] border-2 border-white/[0.08] focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium text-white placeholder:text-gray-500"
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm font-semibold text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 rounded-2xl bg-accent text-white font-bold text-base shadow-lg shadow-accent/25 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              i18n.language === 'he' ? 'התחברות' : 'Login'
            )}
          </button>
        </form>

        <div className="text-center mt-auto pt-6">
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

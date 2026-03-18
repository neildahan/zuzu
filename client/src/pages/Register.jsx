import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { register } from '../api/auth';
import { useState } from 'react';
import zuzuLogo from '../assets/zuzu_logo.png';

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [searchParams] = useSearchParams();
  const prefilledRole = searchParams.get('role');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: prefilledRole === 'trainer' ? 'trainer' : 'client' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      setUser(user);
      if (user.role === 'trainer') navigate('/trainer', { replace: true });
      else navigate(`/client/${user._id}`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error;
      if (msg === 'Email already registered') {
        setError(i18n.language === 'he' ? 'אימייל כבר רשום' : 'Email already registered');
      } else {
        setError(msg || (i18n.language === 'he' ? 'שגיאה בהרשמה' : 'Registration failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* White top — logo + heading */}
      <div className="bg-white">
        <div className="flex items-center justify-between px-5 pt-5">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <img src={zuzuLogo} alt="Zuzu" className="h-10 object-contain" />
          <div className="w-9" />
        </div>
        <div className="text-center pt-6 pb-14 px-6">
          <h1 className="text-2xl font-black text-gray-900">
            {i18n.language === 'he' ? 'יצירת חשבון' : 'Create Account'}
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            {i18n.language === 'he' ? 'הצטרף עוד היום' : 'Join today'}
          </p>
        </div>
      </div>

      {/* Dark bottom — form */}
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black rounded-t-[32px] -mt-6 relative z-10 px-6 pt-6 pb-8 flex flex-col">
        {/* Role tabs */}
        <div className="flex bg-white/[0.06] rounded-2xl p-1 mb-5">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, role: 'trainer' }))}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              form.role === 'trainer' ? 'bg-accent text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            {t('roles.trainer')}
          </button>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, role: 'client' }))}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              form.role === 'client' ? 'bg-accent text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            {t('roles.client')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1.5">
              {i18n.language === 'he' ? 'שם מלא' : 'Full Name'}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={i18n.language === 'he' ? 'השם שלך' : 'Your name'}
              className="w-full p-4 rounded-2xl bg-white/[0.06] border-2 border-white/[0.08] focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium text-white placeholder:text-gray-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1.5">
              {i18n.language === 'he' ? 'אימייל' : 'Email'}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="name@example.com"
              className="w-full p-4 rounded-2xl bg-white/[0.06] border-2 border-white/[0.08] focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium text-white placeholder:text-gray-600"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1.5">
              {i18n.language === 'he' ? 'סיסמה' : 'Password'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={i18n.language === 'he' ? '6 תווים לפחות' : 'At least 6 characters'}
              className="w-full p-4 rounded-2xl bg-white/[0.06] border-2 border-white/[0.08] focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium text-white placeholder:text-gray-600"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

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
              i18n.language === 'he' ? 'הרשמה' : 'Create Account'
            )}
          </button>
        </form>

        <div className="text-center mt-auto pt-6">
          <p className="text-sm text-gray-500">
            {i18n.language === 'he' ? 'כבר יש לך חשבון?' : 'Already have an account?'}{' '}
            <Link to="/login" className="text-accent font-bold">
              {i18n.language === 'he' ? 'התחברות' : 'Login'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

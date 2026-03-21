import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { login } from '../api/auth';
import { useState } from 'react';
import zuzuLogo from '../assets/zuzu_logo.png';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      setUser(user);
      if (user.role === 'trainer') navigate('/trainer', { replace: true });
      else navigate(`/client/${user._id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || (i18n.language === 'he' ? 'שגיאה בהתחברות' : 'Login failed'));
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
            {i18n.language === 'he' ? 'ברוך הבא חזרה' : 'Welcome Back'}
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            {i18n.language === 'he' ? 'התחבר לחשבון שלך' : 'Sign in to your account'}
          </p>
        </div>
      </div>

      {/* Dark bottom — form */}
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black rounded-t-[32px] -mt-6 relative z-10 px-6 pt-8 pb-8 flex flex-col">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••"
              className="w-full p-4 rounded-2xl bg-white/[0.06] border-2 border-white/[0.08] focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium text-white placeholder:text-gray-600"
              required
              autoComplete="current-password"
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
              i18n.language === 'he' ? 'התחברות' : 'Login'
            )}
          </button>
        </form>

        <div className="text-center mt-auto pt-6">
          <p className="text-sm text-gray-500">
            {i18n.language === 'he' ? 'אין לך חשבון?' : "Don't have an account?"}{' '}
            <Link to="/register" className="text-accent font-bold">
              {i18n.language === 'he' ? 'הרשמה' : 'Sign Up'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { updateUser } from '../../api/users';
import { Settings } from 'lucide-react';

export default function AdminProfile() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useUser();
  const isHe = i18n.language === 'he';

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    locale: user?.locale || 'en',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateUser(user._id, {
        name: form.name,
        locale: form.locale,
      });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-lg">
      <div className="flex items-center gap-3">
        <Settings size={24} className="text-gray-400" />
        <h1 className="text-2xl font-black">{t('admin.profile')}</h1>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white font-black text-2xl">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-lg">{user?.name}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 mt-1 inline-block">
            {t('roles.admin')}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1.5">
            {t('admin.name')}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1.5">
            {t('admin.email')}
          </label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1.5">
            {isHe ? 'שפה' : 'Language'}
          </label>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setForm(f => ({ ...f, locale: 'en' }));
                i18n.changeLanguage('en');
                document.documentElement.dir = 'ltr';
                document.documentElement.lang = 'en';
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                form.locale === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(f => ({ ...f, locale: 'he' }));
                i18n.changeLanguage('he');
                document.documentElement.dir = 'rtl';
                document.documentElement.lang = 'he';
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                form.locale === 'he' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}
            >
              עברית
            </button>
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-accent text-white hover:bg-accent/90'
        }`}
      >
        {saved ? (isHe ? 'נשמר!' : 'Saved!') : t('common.save')}
      </button>
    </div>
  );
}

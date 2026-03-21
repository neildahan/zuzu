import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { updateUser } from '../api/users';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    gender: user?.gender || 'male',
    height: user?.height || '',
    weight: user?.weight || '',
    goal: user?.goal || '',
    locale: user?.locale || 'en',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        name: form.name,
        gender: form.gender,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        goal: form.goal || undefined,
        locale: form.locale,
      };
      // If avatar changed to a data URL, include it
      if (avatarPreview && avatarPreview !== user?.avatarUrl) {
        data.avatarUrl = avatarPreview;
      }
      const updated = await updateUser(user._id, data);
      setUser({ ...updated, token: user.token });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success(isHe ? 'הפרופיל עודכן' : 'Profile updated');
    } catch (err) {
      toast.error(isHe ? 'שגיאה בשמירה' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const isHe = i18n.language === 'he';
  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <div className="flex flex-col items-center pt-4">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-accent/20 ring-4 ring-gray-50 overflow-hidden"
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
          {/* Camera overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        <p className="text-xs text-gray-400 font-medium mt-2">
          {isHe ? 'לחץ לשינוי תמונה' : 'Tap to change photo'}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1.5">
            {isHe ? 'שם' : 'Name'}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full p-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1.5">
            {isHe ? 'אימייל' : 'Email'}
          </label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full p-4 rounded-2xl bg-gray-100 border-2 border-gray-100 outline-none font-medium text-gray-400"
          />
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1.5">
            {isHe ? 'שפה' : 'Language'}
          </label>
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <button
              type="button"
              onClick={() => {
                setForm(f => ({ ...f, locale: 'en' }));
                i18n.changeLanguage('en');
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
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
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                form.locale === 'he' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}
            >
              עברית
            </button>
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1.5">
            {isHe ? 'מגדר' : 'Gender'}
          </label>
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, gender: 'male' }))}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                form.gender === 'male' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}
            >
              {isHe ? 'זכר' : 'Male'}
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, gender: 'female' }))}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                form.gender === 'female' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}
            >
              {isHe ? 'נקבה' : 'Female'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">
              {isHe ? 'גובה (ס"מ)' : 'Height (cm)'}
            </label>
            <input
              type="number"
              value={form.height}
              onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
              placeholder="175"
              className="w-full p-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1.5">
              {isHe ? 'משקל (ק"ג)' : 'Weight (kg)'}
            </label>
            <input
              type="number"
              value={form.weight}
              onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
              placeholder="70"
              className="w-full p-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1.5">
            {isHe ? 'מטרה' : 'Goal'}
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'lose_weight', en: 'Lose Weight', he: 'הרזיה' },
              { value: 'build_muscle', en: 'Build Muscle', he: 'בניית שריר' },
              { value: 'get_stronger', en: 'Get Stronger', he: 'להתחזק' },
              { value: 'stay_fit', en: 'Stay Fit', he: 'שמירה על כושר' },
            ].map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, goal: g.value }))}
                className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                  form.goal === g.value
                    ? 'bg-accent text-white shadow-md shadow-accent/30'
                    : 'bg-white border-2 border-gray-100 text-gray-500'
                }`}
              >
                {isHe ? g.he : g.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full p-4 rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 ${
          saved
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
            : 'bg-accent text-white shadow-lg shadow-accent/30 active:scale-[0.98]'
        }`}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            {isHe ? 'נשמר' : 'Saved'}
          </span>
        ) : (
          isHe ? 'שמור שינויים' : 'Save Changes'
        )}
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full p-4 rounded-2xl bg-red-50 text-red-500 font-bold active:scale-[0.98] transition-transform"
      >
        {isHe ? 'התנתק' : 'Logout'}
      </button>
    </div>
  );
}

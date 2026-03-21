import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProgram } from '../../api/programs';
import { useState } from 'react';

export default function ProgramBuilder() {
  const { t } = useTranslation();
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    description: '',
    weekCount: 4,
  });

  const mutation = useMutation({
    mutationFn: (data) => createProgram(data),
    onSuccess: (program) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      navigate(`/trainer/program/${program._id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      trainerId: user._id,
      clientId,
      name: form.name,
      description: form.description || undefined,
      weekCount: Number(form.weekCount),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold">{t('trainer.newProgram')}</h2>
        <p className="text-sm text-gray-400 font-medium mt-1">{t('trainer.description') || 'Create a new training program'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.programName')}</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.description')}</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-1.5">{t('trainer.weeks')}</label>
          <input
            type="number"
            min={1}
            max={52}
            value={form.weekCount}
            onChange={e => setForm(f => ({ ...f, weekCount: e.target.value }))}
            className="w-24 p-4 rounded-2xl bg-white border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full p-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold transition-colors disabled:opacity-50 shadow-lg shadow-accent/30"
        >
          {t('common.save')}
        </button>
      </form>
    </div>
  );
}

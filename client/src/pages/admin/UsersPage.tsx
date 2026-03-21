import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, deleteAdminUser, updateAdminUser } from '../../api/admin';
import { register } from '../../api/auth';
import { getUsers } from '../../api/users';
import Dropdown from '../../components/admin/Dropdown';
import { UserPlus, Send, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search, role: roleFilter }],
    queryFn: () => getAdminUsers({ search: search || undefined, role: roleFilter || undefined }),
  });

  const { data: trainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => getUsers({ role: 'trainer' }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin'] }); toast.success(t('admin.userDeleted')); },
    onError: () => toast.error(t('admin.actionFailed')),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }) => updateAdminUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      setEditUser(null);
      toast.success(t('admin.userUpdated'));
    },
    onError: () => toast.error(t('admin.actionFailed')),
  });

  const createMut = useMutation({
    mutationFn: register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      setShowCreate(false);
      toast.success(t('admin.userCreated'));
    },
    onError: (err) => toast.error(err.response?.data?.error || t('admin.actionFailed')),
  });

  const users = data?.users || [];

  const roleOptions = [
    { value: '', label: t('admin.allRoles') },
    { value: 'trainer', label: t('roles.trainer') },
    { value: 'client', label: t('roles.client') },
    { value: 'admin', label: t('roles.admin') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black">{t('admin.users')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Send size={16} />
            {t('admin.sendInvite')}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors"
          >
            <UserPlus size={16} />
            {t('admin.createUser')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.searchUsers')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-accent/30"
        />
        <Dropdown
          value={roleFilter}
          onChange={setRoleFilter}
          options={roleOptions}
          placeholder={t('admin.allRoles')}
          className="sm:w-48"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.name')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.email')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.role')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.trainer')}</th>
                  <th className="text-start px-4 py-3 font-bold text-gray-500">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        u.role === 'admin' ? 'bg-red-50 text-red-600' :
                        u.role === 'trainer' ? 'bg-blue-50 text-blue-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {t(`roles.${u.role}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.trainerId?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditUser(u)}
                          className="text-xs font-bold text-accent hover:underline"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(t('admin.confirmDelete'))) deleteMut.mutate(u._id);
                          }}
                          className="text-xs font-bold text-red-500 hover:underline"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t('admin.noResults')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          trainers={trainers || []}
          onClose={() => setEditUser(null)}
          onSave={(data) => updateMut.mutate({ id: editUser._id, ...data })}
          isPending={updateMut.isPending}
        />
      )}

      {showCreate && (
        <CreateUserModal
          trainers={trainers || []}
          onClose={() => setShowCreate(false)}
          onSave={(data) => createMut.mutate(data)}
          isPending={createMut.isPending}
          error={createMut.error?.response?.data?.error}
        />
      )}

      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}

function CreateUserModal({ trainers, onClose, onSave, isPending, error }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [trainerId, setTrainerId] = useState('');

  const roleOptions = [
    { value: 'client', label: t('roles.client') },
    { value: 'trainer', label: t('roles.trainer') },
    { value: 'admin', label: t('roles.admin') },
  ];

  const trainerOptions = [
    { value: '', label: `— ${t('admin.noTrainer')} —` },
    ...trainers.map((tr) => ({ value: tr._id, label: tr.name })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">{t('admin.createUser')}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ name, email, password, role, ...(trainerId ? { trainerId } : {}) });
          }}
          className="space-y-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('admin.name')}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('admin.email')}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('admin.password')}
            required
            minLength={6}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          />
          <Dropdown value={role} onChange={setRole} options={roleOptions} placeholder={t('admin.role')} />
          {role === 'client' && (
            <Dropdown value={trainerId} onChange={setTrainerId} options={trainerOptions} placeholder={t('admin.assignTrainer')} />
          )}
          {error && (
            <p className="text-sm font-semibold text-red-500">{error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold text-sm">
              {t('admin.createUser')}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteModal({ onClose }) {
  const { t } = useTranslation();
  const [role, setRole] = useState('client');
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const inviteLink = `${baseUrl}/register?role=${role}`;

  const roleOptions = [
    { value: 'client', label: t('roles.client') },
    { value: 'trainer', label: t('roles.trainer') },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">{t('admin.sendInvite')}</h3>
        <p className="text-sm text-gray-500">{t('admin.inviteDesc')}</p>

        <Dropdown value={role} onChange={setRole} options={roleOptions} placeholder={t('admin.role')} />

        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <span className="flex-1 text-sm text-gray-600 truncate select-all">{inviteLink}</span>
          <button
            onClick={handleCopy}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              copied ? 'bg-emerald-50 text-emerald-600' : 'bg-accent text-white hover:bg-accent/90'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? t('admin.copied') : t('admin.copyLink')}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}

function EditUserModal({ user, trainers, onClose, onSave, isPending }) {
  const { t } = useTranslation();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [trainerId, setTrainerId] = useState(user.trainerId?._id || '');

  const roleOptions = [
    { value: 'client', label: t('roles.client') },
    { value: 'trainer', label: t('roles.trainer') },
    { value: 'admin', label: t('roles.admin') },
  ];

  const trainerOptions = [
    { value: '', label: `— ${t('admin.noTrainer')} —` },
    ...trainers.map((tr) => ({ value: tr._id, label: tr.name })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">{t('common.edit')} — {user.name}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ name, email, role, trainerId: trainerId || null });
          }}
          className="space-y-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          />
          <Dropdown value={role} onChange={setRole} options={roleOptions} placeholder={t('admin.role')} />
          <Dropdown value={trainerId} onChange={setTrainerId} options={trainerOptions} placeholder={t('admin.noTrainer')} />
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold text-sm">
              {t('common.save')}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

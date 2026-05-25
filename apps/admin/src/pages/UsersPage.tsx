import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, UserX, UserCheck, Users } from 'lucide-react';
import { getUsers, toggleUserActive } from '../api/service';
import type { MockUser } from '../api/mockData';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';

export function UsersPage() {
  const [usersList, setUsersList] = useState<MockUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search State
  const [search, setSearch] = useState('');

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    isActive: boolean;
  }>({
    isOpen: false,
    userId: '',
    userName: '',
    isActive: true,
  });

  const navigate = useNavigate();

  const loadUsers = () => {
    setIsLoading(true);
    getUsers()
      .then((data) => {
        setUsersList(data);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load users', err);
        setError('Failed to retrieve registered users. Please check API links.');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  const handleOpenConfirmToggle = (usr: MockUser) => {
    setConfirmModal({
      isOpen: true,
      userId: usr.id,
      userName: usr.name,
      isActive: usr.isActive,
    });
  };

  const handleConfirmToggle = async () => {
    try {
      await toggleUserActive(confirmModal.userId);
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      loadUsers();
    } catch (err) {
      console.error('Failed to toggle user status', err);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Retrieving user accounts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Monitor user enrollments, streaking behaviors, and configure platform access locks."
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Total: {filteredUsers.length} Account(s)
        </div>
      </section>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Users size={28} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">No accounts found</h3>
          <p className="mt-1 text-sm text-slate-500">No users match your criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Name & Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.map((usr) => (
                <tr key={usr.id} className={`hover:bg-slate-50 transition-colors ${usr.isActive ? '' : 'bg-slate-50/35 text-slate-400'}`}>
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{usr.name}</p>
                    <p className="font-mono text-2xs text-slate-400">{usr.email}</p>
                  </td>
                  <td className="p-4">
                    <StatusBadge value={usr.role} />
                  </td>
                  <td className="p-4 font-semibold text-slate-500">{usr.createdAt.slice(0, 10)}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        usr.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}
                    >
                      {usr.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {usr.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleOpenConfirmToggle(usr)}
                          type="button"
                          title={usr.isActive ? 'Disable User' : 'Enable User'}
                          className={`p-1.5 rounded-lg border transition ${
                            usr.isActive
                              ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {usr.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/users/${usr.id}`)}
                        type="button"
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3.5 text-xs font-bold text-indigo-600 bg-white hover:bg-slate-50 transition"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.userName}
        message={`Are you sure you want to ${
          confirmModal.isActive ? 'DISABLE' : 'ENABLE'
        } user account "${confirmModal.userName}"? Locked users cannot access mobile endpoints.`}
        confirmText="Confirm Lock Switch"
        isDanger={confirmModal.isActive}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

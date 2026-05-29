/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Search, Sparkles, Ban } from 'lucide-react';
import { getCustomChallenges, deleteChallenge } from '../api/service';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import type { CustomChallengeRow } from '../api/mockData';

export function CustomChallengesPage() {
  const [list, setList] = useState<CustomChallengeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [confirm, setConfirm] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });

  const load = () => {
    setIsLoading(true);
    getCustomChallenges()
      .then((data) => {
        setList(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load custom challenges', err);
        setError('Failed to retrieve user-created challenges.');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleConfirmDeactivate = async () => {
    try {
      await deleteChallenge(confirm.id);
      setConfirm((prev) => ({ ...prev, isOpen: false }));
      load();
    } catch (err) {
      console.error('Failed to deactivate custom challenge', err);
    }
  };

  const filtered = list.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(term) ||
      c.creatorName.toLowerCase().includes(term) ||
      c.creatorEmail.toLowerCase().includes(term) ||
      c.shortDescription.toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Retrieving user-created challenges...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Challenges"
        description="Moderate challenges created by users. Deactivate any that violate the content policy."
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white"
            placeholder="Search by title, creator, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          {filtered.length} Challenge(s)
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Sparkles size={28} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">No custom challenges</h3>
          <p className="mt-1 text-sm text-slate-500">No user-created challenges match your search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Challenge</th>
                <th className="p-4">Creator</th>
                <th className="p-4">Visibility</th>
                <th className="p-4 text-center">Joined</th>
                <th className="p-4 text-center">Invites</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((c) => (
                <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${c.isActive ? '' : 'bg-slate-50/30 text-slate-400'}`}>
                  <td className="p-4 max-w-xs">
                    <p className="font-bold text-slate-900">{c.title}</p>
                    <p className="text-xs text-slate-500 leading-normal line-clamp-2">{c.shortDescription}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-700">{c.creatorName}</p>
                    <p className="font-mono text-2xs text-slate-400">{c.creatorEmail}</p>
                  </td>
                  <td className="p-4">
                    <StatusBadge value={c.visibility} />
                  </td>
                  <td className="p-4 text-center font-semibold text-slate-500">{c.joinedCount}</td>
                  <td className="p-4 text-center font-semibold text-slate-500">{c.inviteCount}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        c.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {c.isActive ? (
                      <button
                        onClick={() => setConfirm({ isOpen: true, id: c.id, title: c.title })}
                        type="button"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                      >
                        <Ban size={14} />
                        Deactivate
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-300">Unpublished</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={confirm.isOpen}
        title={`Deactivate "${confirm.title}"`}
        message={`Are you sure you want to unpublish "${confirm.title}"? It will be hidden from all participants. This is a soft deactivation and can be reversed from the Challenges page.`}
        confirmText="Deactivate Challenge"
        isDanger
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setConfirm((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

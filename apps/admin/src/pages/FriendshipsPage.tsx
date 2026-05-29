import { useEffect, useState } from 'react';
import { Search, Users, ArrowRight } from 'lucide-react';
import { getFriendships } from '../api/service';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import type { FriendshipRow } from '../api/mockData';

const PAGE_SIZE = 100;

export function FriendshipsPage() {
  const [list, setList] = useState<FriendshipRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getFriendships({ skip: 0, take: PAGE_SIZE })
      .then((data) => {
        setList(data.friendships);
        setTotal(data.total);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load friendships', err);
        setError('Failed to retrieve friendship records.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = list.filter((f) => {
    const term = search.toLowerCase();
    return (
      f.requesterName.toLowerCase().includes(term) ||
      f.recipientName.toLowerCase().includes(term) ||
      f.status.toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Retrieving friendship graph...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Friendships"
        description={`Read-only view of the social graph. ${total} total connection(s).`}
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
            placeholder="Search by participant name or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          {filtered.length} Connection(s)
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Users size={28} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">No friendships</h3>
          <p className="mt-1 text-sm text-slate-500">No connections match your search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Connection</th>
                <th className="p-4">Status</th>
                <th className="p-4">Requested</th>
                <th className="p-4">Responded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                      <span>{f.requesterName}</span>
                      <ArrowRight size={14} className="text-slate-400" />
                      <span>{f.recipientName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge value={f.status} />
                  </td>
                  <td className="p-4 font-medium text-slate-500 text-xs">
                    {f.createdAt.replace('T', ' ').slice(0, 16)}
                  </td>
                  <td className="p-4 font-medium text-slate-500 text-xs">
                    {f.respondedAt ? f.respondedAt.replace('T', ' ').slice(0, 16) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

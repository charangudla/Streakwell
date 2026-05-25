import { useEffect, useState } from 'react';
import { Search, Share2, Heart } from 'lucide-react';
import { getShareEvents } from '../api/service';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import type { ShareEventWithDetails } from '../api/mockData';

export function ShareEventsPage() {
  const [sharesList, setSharesList] = useState<ShareEventWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    getShareEvents()
      .then((data) => {
        setSharesList(data);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load share events', err);
        setError('Failed to retrieve social sharing records.');
        setIsLoading(false);
      });
  }, []);

  const filteredShares = sharesList.filter((se) => {
    const term = search.toLowerCase();
    const matchesSearch =
      se.userName.toLowerCase().includes(term) ||
      se.userEmail.toLowerCase().includes(term) ||
      (se.platform && se.platform.toLowerCase().includes(term));

    const matchesType = typeFilter ? se.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  const getPayloadText = (se: ShareEventWithDetails) => {
    if (!se.payload) return '-';
    const p = se.payload;
    switch (se.type) {
      case 'CHALLENGE_INVITE':
        return `Invite Link: ${p.inviteLink ?? 'General invite'}`;
      case 'DAILY_PROGRESS':
        return `Challenge: ${p.challengeTitle ?? 'Unknown'} (Day #${p.day ?? '?'})`;
      case 'COMPLETION':
        return `Successfully completed challenge: ${p.challengeTitle ?? 'Unknown'}`;
      default:
        return JSON.stringify(p);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Retrieving viral share logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Share Events"
        description="Monitor participant sharing behaviors, external platform virality, and invite creations."
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Filter toolbar */}
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white"
            placeholder="Search by username, email, or social platform..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <select
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Share Types</option>
            <option value="CHALLENGE_INVITE">Challenge Invite</option>
            <option value="DAILY_PROGRESS">Daily Progress</option>
            <option value="COMPLETION">Completion Highlight</option>
          </select>
        </div>
      </section>

      {/* Table List */}
      {filteredShares.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Share2 size={28} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">No share events matched</h3>
          <p className="mt-1 text-sm text-slate-500">Try modifying your search or filter values.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">User Details</th>
                <th className="p-4">Share Type</th>
                <th className="p-4">Platform</th>
                <th className="p-4">Event Metadata / Details</th>
                <th className="p-4 text-right">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredShares.map((se) => (
                <tr key={se.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{se.userName}</p>
                    <p className="font-mono text-2xs text-slate-400">{se.userEmail}</p>
                  </td>
                  <td className="p-4">
                    <StatusBadge value={se.type} />
                  </td>
                  <td className="p-4 font-bold text-slate-700">
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600">
                      <Heart size={12} className="text-slate-400" />
                      {se.platform ?? 'General'}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-medium text-slate-600 max-w-sm break-all leading-normal">
                    {getPayloadText(se)}
                  </td>
                  <td className="p-4 text-right font-medium text-slate-500 text-xs">
                    {se.createdAt.replace('T', ' ').slice(0, 16)}
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

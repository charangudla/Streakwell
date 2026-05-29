import { useEffect, useState } from 'react';
import { Search, Calendar, ClipboardCheck } from 'lucide-react';
import { getCheckins } from '../api/service';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import type { CheckinRow } from '../api/mockData';

const PAGE_SIZE = 100;

export function CheckinsPage() {
  const [checkinsList, setCheckinsList] = useState<CheckinRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    getCheckins({ skip: 0, take: PAGE_SIZE })
      .then((data) => {
        setCheckinsList(data.checkins);
        setTotal(data.total);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load checkins list', err);
        setError('Failed to retrieve daily checkins logs.');
        setIsLoading(false);
      });
  }, []);

  const filteredCheckins = checkinsList.filter((ck) => {
    const term = search.toLowerCase();
    const matchesSearch =
      ck.userName.toLowerCase().includes(term) ||
      ck.userEmail.toLowerCase().includes(term) ||
      ck.challengeTitle.toLowerCase().includes(term) ||
      (ck.notes && ck.notes.toLowerCase().includes(term));

    const matchesStatus = statusFilter ? ck.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Compiling check-ins tracker feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Check-ins Tracker"
        description={`Monitor everyday participant compliance, task comments, and check-in marks. ${total} total check-in(s) recorded.`}
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
            placeholder="Search by participant name, email, challenge, or journal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <select
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Check-in Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
            <option value="SKIPPED">Skipped</option>
          </select>
        </div>
      </section>

      {/* Table List */}
      {filteredCheckins.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <ClipboardCheck size={28} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">No check-ins matched</h3>
          <p className="mt-1 text-sm text-slate-500">Try modifying your filter parameters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Participant Details</th>
                <th className="p-4">Wellness Challenge</th>
                <th className="p-4">Check-in Date</th>
                <th className="p-4">Compliance Status</th>
                <th className="p-4">Journal / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCheckins.map((ck) => (
                <tr key={ck.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{ck.userName}</p>
                    <p className="font-mono text-2xs text-slate-400">{ck.userEmail}</p>
                  </td>
                  <td className="p-4 font-bold text-slate-700">{ck.challengeTitle}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-slate-500 font-semibold">
                      <Calendar size={13} className="text-slate-400" />
                      {ck.checkinDate}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge value={ck.status} />
                  </td>
                  <td className="p-4 text-xs italic text-slate-500 max-w-xs leading-normal">
                    {ck.notes ? `"${ck.notes}"` : <span className="text-slate-300">-</span>}
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

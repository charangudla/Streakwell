/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { Mail, CheckCircle2, RotateCcw, Inbox } from 'lucide-react';
import { getContactSubmissions, resolveContactSubmission } from '../api/service';
import { PageHeader } from '../components/PageHeader';
import type { ContactSubmissionRow } from '../api/mockData';

type ResolvedFilter = 'all' | 'unresolved' | 'resolved';

export function ContactSubmissionsPage() {
  const [list, setList] = useState<ContactSubmissionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ResolvedFilter>('unresolved');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback((current: ResolvedFilter) => {
    setIsLoading(true);
    const resolved = current === 'all' ? undefined : current === 'resolved';
    getContactSubmissions({ resolved, skip: 0, take: 100 })
      .then((data) => {
        setList(data.submissions);
        setTotal(data.total);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load contact submissions', err);
        setError('Failed to retrieve contact submissions.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const handleToggleResolved = async (row: ContactSubmissionRow) => {
    setBusyId(row.id);
    try {
      await resolveContactSubmission(row.id, !row.resolvedAt);
      load(filter);
    } catch (err) {
      console.error('Failed to update contact submission', err);
      setError('Could not update the submission.');
    } finally {
      setBusyId(null);
    }
  };

  const filterTabs: { key: ResolvedFilter; label: string }[] = [
    { key: 'unresolved', label: 'Unresolved' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Submissions"
        description={`Review and resolve messages sent through the public contact form. ${total} in this view.`}
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <section className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-bold transition ${
              filter === tab.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {isLoading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-500">Loading submissions...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Inbox size={28} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">No submissions</h3>
          <p className="mt-1 text-sm text-slate-500">Nothing matches this filter right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((row) => (
            <div
              key={row.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                row.resolvedAt ? 'border-slate-200 opacity-80' : 'border-emerald-100'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 border text-slate-600">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{row.name}</p>
                    <p className="font-mono text-2xs text-slate-400">{row.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-2xs font-semibold text-slate-400">
                      <span>{row.createdAt.replace('T', ' ').slice(0, 16)}</span>
                      {row.ipAddress && <span className="font-mono">· IP {row.ipAddress}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {row.resolvedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-emerald-700">
                      <CheckCircle2 size={12} />
                      Resolved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-amber-700">
                      Open
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => handleToggleResolved(row)}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition disabled:opacity-50 ${
                      row.resolvedAt
                        ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {row.resolvedAt ? (
                      <>
                        <RotateCcw size={14} />
                        Reopen
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        Mark Resolved
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {row.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

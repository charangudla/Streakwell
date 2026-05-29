/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Search, MessageSquare, Trash2 } from 'lucide-react';
import { getChatMessages, deleteChatMessage } from '../api/service';
import { PageHeader } from '../components/PageHeader';
import { ConfirmModal } from '../components/ConfirmModal';
import type { ChatMessageRow } from '../api/mockData';

const PAGE_SIZE = 100;

export function ChatModerationPage() {
  const [list, setList] = useState<ChatMessageRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [confirm, setConfirm] = useState<{ isOpen: boolean; id: string; label: string }>({
    isOpen: false,
    id: '',
    label: '',
  });

  const load = () => {
    setIsLoading(true);
    getChatMessages({ skip: 0, take: PAGE_SIZE })
      .then((data) => {
        setList(data.messages);
        setTotal(data.total);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load chat messages', err);
        setError('Failed to retrieve chat messages.');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleConfirmDelete = async () => {
    try {
      await deleteChatMessage(confirm.id);
      setConfirm((prev) => ({ ...prev, isOpen: false }));
      load();
    } catch (err) {
      console.error('Failed to delete chat message', err);
    }
  };

  const messageText = (m: ChatMessageRow): string =>
    m.kind === 'PRESET' ? `Preset: ${m.presetCode ?? 'unknown'}` : (m.body ?? '');

  const filtered = list.filter((m) => {
    const term = search.toLowerCase();
    return (
      m.userName.toLowerCase().includes(term) ||
      m.challengeTitle.toLowerCase().includes(term) ||
      messageText(m).toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Retrieving chat messages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat Moderation"
        description={`Review challenge chat messages and remove anything inappropriate. ${total} total message(s).`}
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
            placeholder="Search by user, challenge, or message body..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          {filtered.length} Message(s)
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <MessageSquare size={28} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">No messages</h3>
          <p className="mt-1 text-sm text-slate-500">No chat messages match your search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Sender</th>
                <th className="p-4">Challenge</th>
                <th className="p-4">Kind</th>
                <th className="p-4">Message</th>
                <th className="p-4">Sent</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{m.userName}</td>
                  <td className="p-4 font-semibold text-slate-600">{m.challengeTitle}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-2xs font-extrabold uppercase tracking-wide border ${
                        m.kind === 'CELEBRATION'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {m.kind}
                    </span>
                  </td>
                  <td className="p-4 max-w-sm text-slate-700 leading-normal break-words">
                    {messageText(m) || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="p-4 text-xs font-medium text-slate-500">
                    {m.createdAt.replace('T', ' ').slice(0, 16)}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() =>
                        setConfirm({ isOpen: true, id: m.id, label: messageText(m) || m.kind })
                      }
                      type="button"
                      title="Delete message"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={confirm.isOpen}
        title="Delete chat message"
        message={`Permanently delete this message? "${confirm.label.slice(0, 120)}". This cannot be undone.`}
        confirmText="Delete Message"
        isDanger
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirm((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

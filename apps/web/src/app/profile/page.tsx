"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/Container";
import { authClient, useSession } from "@/lib/auth-client";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileInner />
    </AuthGuard>
  );
}

function ProfileInner() {
  const router = useRouter();
  const { data: session, refetch } = useSession();
  const user = session?.user ?? null;

  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function onSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!user || saving) return;
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError("Name can't be empty.");
      return;
    }
    if (trimmed === user.name) {
      setSavedMessage("Nothing to save.");
      return;
    }
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    const { error: err } = await authClient.updateUser({ name: trimmed });
    setSaving(false);
    if (err) {
      setError(err.message ?? "Could not update profile.");
      return;
    }
    setSavedMessage("Saved.");
    await refetch();
  }

  async function onDelete() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    const { error: err } = await authClient.deleteUser({});
    setDeleting(false);
    if (err) {
      setError(err.message ?? "Could not delete account.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  if (!user) return null;

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Profile
        </h1>

        <form
          onSubmit={onSaveName}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Email
            </label>
            <input
              id="email"
              value={user.email}
              disabled
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-ink-muted"
            />
            <p className="text-xs text-ink-muted">
              Email isn&rsquo;t editable from the website yet.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <label
              htmlFor="name"
              className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Display name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            />
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          ) : null}
          {savedMessage ? (
            <p className="mt-4 text-sm font-semibold text-brand-700">
              {savedMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/50 p-6 sm:p-8">
          <h2 className="text-base font-bold text-rose-800">Delete account</h2>
          <p className="mt-2 text-sm text-rose-900/70">
            Permanently removes your account, challenges, check-ins, share
            events, and achievements. This cannot be undone.
          </p>
          <label
            htmlFor="confirm"
            className="mt-4 block text-xs font-semibold uppercase tracking-wide text-rose-800"
          >
            Type DELETE to confirm
          </label>
          <input
            id="confirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-rose-300 bg-white px-4 text-base text-ink focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteConfirm !== "DELETE" || deleting}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-rose-600 px-6 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete account permanently"}
          </button>
        </div>
      </Container>
    </section>
  );
}

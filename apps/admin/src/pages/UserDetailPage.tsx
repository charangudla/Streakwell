/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Mail,
  Users as UsersIcon,
  MessageSquare,
  UserX,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { getUserDetails, setUserActive, setUserRole } from '../api/service';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuth, type UserRole } from '../routing/AuthProvider';
import type { UserDetailResponse } from '../api/mockData';

const CURRENT_YEAR = new Date().getFullYear();

function formatMeasure(value: number | null, suffix: string): string {
  return value == null ? '—' : `${value} ${suffix}`;
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [details, setDetails] = useState<UserDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmActiveOpen, setConfirmActiveOpen] = useState(false);
  const [savingRole, setSavingRole] = useState(false);

  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  const canManageRoles = currentAdmin?.role === 'SUPER_ADMIN';

  const load = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    getUserDetails(id)
      .then((data) => {
        setDetails(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load user details', err);
        setError('Failed to fetch detailed profile. Account may not exist.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async () => {
    if (!details) return;
    try {
      await setUserActive(details.user.id, !details.user.isActive);
      setConfirmActiveOpen(false);
      load();
    } catch (err) {
      console.error('Failed to toggle user status', err);
      setActionError('Could not update the account status.');
    }
  };

  const handleRoleChange = async (role: UserRole) => {
    if (!details || role === details.user.role) return;
    setSavingRole(true);
    setActionError(null);
    try {
      await setUserRole(details.user.id, role);
      load();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not update the user role.';
      setActionError(message);
    } finally {
      setSavingRole(false);
    }
  };

  if (isLoading && !details) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Compiling user detailed profile...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/users')}
          className="inline-flex h-9 items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ChevronLeft size={16} />
          Back to Users
        </button>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error ?? 'Profile record not found.'}
        </div>
      </div>
    );
  }

  const { user, joinedChallenges, createdChallenges, friendCount, chatMessageCount } = details;
  const age = user.birthYear ? CURRENT_YEAR - user.birthYear : null;

  const profileFields: { label: string; value: string }[] = [
    { label: 'Username', value: user.username ?? '—' },
    { label: 'Phone', value: user.phone ?? '—' },
    { label: 'Gender', value: user.gender ?? '—' },
    { label: 'Age', value: age != null ? `${age} (born ${user.birthYear})` : '—' },
    { label: 'Height', value: formatMeasure(user.heightCm, 'cm') },
    { label: 'Weight', value: formatMeasure(user.weightKg, 'kg') },
    { label: 'Units', value: user.unitPreference ?? '—' },
    { label: 'Primary Goal', value: user.primaryGoal ?? '—' },
    { label: 'Daily Minutes', value: user.dailyMinutes != null ? `${user.dailyMinutes} min` : '—' },
    { label: 'Interests', value: user.interestCategoryIds.length ? `${user.interestCategoryIds.length} categories` : '—' },
    { label: 'Referral Code', value: user.referralCode ?? '—' },
    { label: 'Onboarding', value: user.onboardingCompletedAt ? user.onboardingCompletedAt.slice(0, 10) : 'Incomplete' },
    { label: 'Email Verified', value: user.emailVerified ? 'Yes' : 'No' },
    { label: 'Joined', value: user.createdAt.slice(0, 10) },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/users')}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition"
            aria-label="Back to Users"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {user.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500 flex items-center gap-1.5">
              <Mail size={14} className="text-slate-400" />
              {user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge value={user.role} />
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
              user.isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}
          >
            {user.isActive ? 'Active Access' : 'Suspended'}
          </span>
        </div>
      </section>

      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {actionError}
        </div>
      )}

      {/* Admin Action Bar */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <UsersIcon size={16} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900 leading-none">{friendCount}</p>
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 mt-1">Friends</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
              <MessageSquare size={16} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900 leading-none">{chatMessageCount}</p>
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 mt-1">Chat Messages</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canManageRoles && user.role !== 'SUPER_ADMIN' && (
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <ShieldCheck size={15} className="text-slate-400" />
              Role
              <select
                className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-600 disabled:opacity-50"
                value={user.role}
                disabled={savingRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER ADMIN</option>
              </select>
            </label>
          )}

          {user.role !== 'SUPER_ADMIN' && (
            <button
              onClick={() => setConfirmActiveOpen(true)}
              type="button"
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
                user.isActive
                  ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
              {user.isActive ? 'Suspend' : 'Reactivate'}
            </button>
          )}
        </div>
      </section>

      {/* Profile Details Grid */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Profile Details</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          {profileFields.map((field) => (
            <div key={field.label}>
              <dt className="text-2xs font-bold uppercase tracking-wider text-slate-400">{field.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800 break-words">{field.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Joined Challenges */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Joined Challenges</h2>
          {joinedChallenges.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
              <p className="text-sm font-semibold text-slate-400">This user has not joined any challenges yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {joinedChallenges.map((uc) => {
                const pct = uc.durationDays > 0 ? Math.min(100, Math.round((uc.checkinsCount / uc.durationDays) * 100)) : 0;
                return (
                  <div key={uc.id} className="rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">{uc.challengeTitle}</h3>
                        <span className="text-2xs font-semibold text-slate-400">Started: {uc.startDate.slice(0, 10)}</span>
                      </div>
                      <StatusBadge value={uc.status} />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>Progression</span>
                        <span>{pct}% ({uc.checkinsCount} / {uc.durationDays} Days)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Created (Custom) Challenges */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Created Challenges</h2>
          {createdChallenges.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
              <p className="text-sm font-semibold text-slate-400">This user has not created any custom challenges.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {createdChallenges.map((cc) => (
                <div key={cc.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 border text-slate-700">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{cc.title}</p>
                      <p className="text-2xs font-semibold text-slate-400">Created {cc.createdAt.slice(0, 10)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge value={cc.visibility} />
                    <span className={`text-2xs font-bold uppercase tracking-wide ${cc.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {cc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        isOpen={confirmActiveOpen}
        title={user.name}
        message={`Are you sure you want to ${
          user.isActive ? 'SUSPEND' : 'REACTIVATE'
        } "${user.name}"? Suspended users cannot access the mobile or web app.`}
        confirmText={user.isActive ? 'Suspend Account' : 'Reactivate Account'}
        isDanger={user.isActive}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmActiveOpen(false)}
      />
    </div>
  );
}

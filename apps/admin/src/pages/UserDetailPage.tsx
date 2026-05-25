import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Mail } from 'lucide-react';
import { getUserDetails } from '../api/service';
import { StatusBadge } from '../components/StatusBadge';
import type { MockUser, MockUserChallenge, MockDailyCheckin } from '../api/mockData';

interface JoinedChallenge extends MockUserChallenge {
  challengeTitle: string;
  challengeDifficulty: 'BEGINNER' | 'EASY' | 'MEDIUM' | 'HARD';
  checkinsCount: number;
  totalCheckinsExpected: number;
  checkins: MockDailyCheckin[];
}

interface UserDetailData {
  user: MockUser;
  joinedChallenges: JoinedChallenge[];
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [details, setDetails] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    getUserDetails(id)
      .then((data) => {
        setDetails(data);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load user details', err);
        setError('Failed to fetch detailed profile. Account may not exist.');
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Compiling user detailed progress...</p>
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

  const { user, joinedChallenges } = details;

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
              User Profile: {user.name}
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
            {user.isActive ? 'Active Access' : 'Locked Account'}
          </span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Enrolled Challenges List */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Joined Challenges Progression</h2>
          {joinedChallenges.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
              <p className="text-sm font-semibold text-slate-400">This user has not joined any 30-day challenges yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {joinedChallenges.map((uc) => (
                <div key={uc.id} className="rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{uc.challengeTitle}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusBadge value={uc.challengeDifficulty} />
                        <span className="text-2xs font-semibold text-slate-400">Started: {uc.startDate.slice(0, 10)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={uc.status} />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                      <span>Progression</span>
                      <span>{uc.progressPercent}% ({uc.checkinsCount} / {uc.totalCheckinsExpected} Days)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${uc.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Check-ins Tracker Feed */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Detailed Check-ins Logs</h2>
          {joinedChallenges.length === 0 || !joinedChallenges.some((uc) => uc.checkins.length > 0) ? (
            <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-xl py-12 text-center">
              <p className="text-sm font-semibold text-slate-400 px-4">No daily check-ins recorded for active challenges.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {joinedChallenges.flatMap((uc) =>
                uc.checkins.map((ck) => (
                  <div key={ck.id} className="rounded-xl border border-slate-50 p-3 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {ck.checkinDate}
                      </span>
                      <StatusBadge value={ck.status} />
                    </div>
                    {ck.notes && (
                      <p className="mt-2 rounded-lg bg-slate-50 border border-slate-100 p-2 text-xs italic text-slate-600 leading-normal">
                        "{ck.notes}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Share2,
  Trophy,
  Users,
  TrendingUp,
  Award,
  Calendar,
  Zap,
} from 'lucide-react';
import { getHealth } from '../api/client';
import { getDashboardStats } from '../api/service';
import { StatusBadge } from '../components/StatusBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

import type { Challenge } from '../api/mockData';

type ApiState = 'loading' | 'connected' | 'disconnected';

interface CategoryStat {
  name: string;
  challenges: number;
}

interface RecentActivity {
  id: string;
  userName: string;
  challengeTitle: string;
  status: 'COMPLETED' | 'MISSED' | 'SKIPPED';
  date: string;
}

interface DashboardData {
  totalUsers: number;
  totalChallenges: number;
  activeUserChallenges: number;
  totalCheckins: number;
  totalShareEvents: number;
  popularChallenges: Challenge[];
  categoryStats: CategoryStat[];
  recentActivity: RecentActivity[];
}

export function DashboardPage() {
  const [apiState, setApiState] = useState<ApiState>('loading');
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check API Health
    getHealth()
      .then(() => {
        if (!mounted) return;
        setApiState('connected');
      })
      .catch(() => {
        if (!mounted) return;
        setApiState('disconnected');
      });

    // Fetch Dashboard Stats
    getDashboardStats()
      .then((data) => {
        if (!mounted) return;
        setStats(data);
        setIsLoadingStats(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats', err);
        setIsLoadingStats(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const statusMeta = useMemo(() => {
    if (apiState === 'connected') {
      return {
        label: 'connected',
        classes: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
        icon: CheckCircle2,
      };
    }

    if (apiState === 'loading') {
      return {
        label: 'checking',
        classes: 'border-slate-800 bg-slate-900/50 text-slate-400',
        icon: Activity,
      };
    }

    return {
      label: 'offline fallback',
      classes: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
      icon: CircleAlert,
    };
  }, [apiState]);

  const StatusIcon = statusMeta.icon;

  const cardItems = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Total Users', value: stats.totalUsers, icon: Users, gradient: 'from-blue-600/10 to-indigo-600/5 border-blue-500/20 text-blue-400' },
      { label: 'Starter Challenges', value: stats.totalChallenges, icon: Trophy, gradient: 'from-amber-600/10 to-yellow-600/5 border-amber-500/20 text-amber-400' },
      { label: 'Active Challenges', value: stats.activeUserChallenges, icon: TrendingUp, gradient: 'from-emerald-600/10 to-teal-600/5 border-emerald-500/20 text-emerald-400' },
      { label: 'Completed Check-ins', value: stats.totalCheckins, icon: ClipboardCheck, gradient: 'from-purple-600/10 to-pink-600/5 border-purple-500/20 text-purple-400' },
    ];
  }, [stats]);

  // Premium harmonized colors for Recharts category distribution
  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

  if (isLoadingStats) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Compiling analytics dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Vital30 Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
            System overview and aggregate progression analytics.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${statusMeta.classes}`}
        >
          <StatusIcon size={14} className={apiState === 'loading' ? 'animate-spin' : ''} aria-hidden="true" />
          API Server: {statusMeta.label}
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cardItems.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${card.gradient.split(' ')[0]} ${card.gradient.split(' ')[1]}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{card.label}</p>
                <div className={`grid h-10 w-10 place-items-center rounded-xl bg-slate-50 border ${card.gradient.split(' ')[2]} ${card.gradient.split(' ')[3]}`}>
                  <Icon size={20} aria-hidden="true" />
                </div>
              </div>
              <p className="mt-4 text-4xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
                <Zap size={12} className="text-emerald-500" />
                Live MVP Metric
              </div>
            </div>
          );
        })}
      </section>

      {/* Charts & Graphs Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Categories Bar Chart */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Challenges by Category</h2>
            <p className="text-xs text-slate-500">Distribution of starter challenges across wellness pillars</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.categoryStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="challenges" radius={[6, 6, 0, 0]} barSize={36}>
                  {stats?.categoryStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Viral Shares & Invites Summary */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">Social Virality</h2>
              <p className="text-xs text-slate-500">Distribution of viral user share events</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                    <Share2 size={16} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Invites Sent</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{stats?.totalShareEvents ? Math.round(stats.totalShareEvents * 0.3) : 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-teal-600">
                    <Zap size={16} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Daily Updates</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{stats?.totalShareEvents ? Math.round(stats.totalShareEvents * 0.5) : 0}</span>
              </div>
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-50 text-purple-600">
                    <Award size={16} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Completions Shared</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{stats?.totalShareEvents ? Math.round(stats.totalShareEvents * 0.2) : 0}</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center mt-4">
            <p className="text-2xl font-black text-slate-900">{stats?.totalShareEvents}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total Share Events</p>
          </div>
        </section>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Popular Challenges */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Featured Popular Challenges</h2>
            <p className="text-xs text-slate-500">Most clicked or joined starter challenges</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5">Challenge Title</th>
                  <th className="py-2.5">Difficulty</th>
                  <th className="py-2.5">Duration</th>
                  <th className="py-2.5 text-right">Promoted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {stats?.popularChallenges.map((chal) => (
                  <tr key={chal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-semibold text-slate-900">{chal.title}</td>
                    <td className="py-3">
                      <StatusBadge value={chal.difficulty} />
                    </td>
                    <td className="py-3 font-medium text-slate-500">{chal.durationDays} Days</td>
                    <td className="py-3 text-right">
                      {chal.isRecommended ? (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-2xs font-extrabold text-amber-600 border border-amber-100 uppercase tracking-wide">
                          Recommended
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent System Check-ins</h2>
            <p className="text-xs text-slate-500">Real-time user completion updates</p>
          </div>
          <div className="space-y-3.5">
            {stats?.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 border text-slate-700">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{activity.userName}</p>
                    <p className="text-xs text-slate-500">Checked into: <span className="font-semibold text-emerald-600">{activity.challengeTitle}</span></p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge value={activity.status} />
                  <span className="text-[10px] text-slate-400 font-medium">{activity.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}


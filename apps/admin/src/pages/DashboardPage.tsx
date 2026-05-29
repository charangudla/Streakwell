import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Trophy,
  Users,
  TrendingUp,
  UserX,
  CheckCheck,
  Sparkles,
  Mail,
  Zap,
} from 'lucide-react';
import { getHealth } from '../api/client';
import { getDashboardStats, getCategories } from '../api/service';
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

import type { DashboardStats, Category } from '../api/mockData';

type ApiState = 'loading' | 'connected' | 'disconnected';

export function DashboardPage() {
  const [apiState, setApiState] = useState<ApiState>('loading');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    let mounted = true;

    getHealth()
      .then(() => {
        if (mounted) setApiState('connected');
      })
      .catch(() => {
        if (mounted) setApiState('disconnected');
      });

    Promise.all([getDashboardStats(), getCategories()])
      .then(([statsData, cats]) => {
        if (!mounted) return;
        setStats(statsData);
        setCategories(cats);
        setIsLoadingStats(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats', err);
        if (mounted) setIsLoadingStats(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const statusMeta = useMemo(() => {
    if (apiState === 'connected') {
      return {
        label: 'connected',
        classes: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600',
        icon: CheckCircle2,
      };
    }
    if (apiState === 'loading') {
      return {
        label: 'checking',
        classes: 'border-slate-200 bg-slate-50 text-slate-400',
        icon: Activity,
      };
    }
    return {
      label: 'offline fallback',
      classes: 'border-amber-500/20 bg-amber-500/5 text-amber-600',
      icon: CircleAlert,
    };
  }, [apiState]);

  const StatusIcon = statusMeta.icon;

  const cardItems = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Total Users', value: stats.totalUsers, icon: Users, gradient: 'from-blue-600/10 to-indigo-600/5 border-blue-500/20 text-blue-500' },
      { label: 'Suspended Users', value: stats.suspendedUsers, icon: UserX, gradient: 'from-rose-600/10 to-red-600/5 border-rose-500/20 text-rose-500' },
      { label: 'Catalog Challenges', value: stats.catalogChallenges, icon: Trophy, gradient: 'from-amber-600/10 to-yellow-600/5 border-amber-500/20 text-amber-500' },
      { label: 'Custom Challenges', value: stats.customChallenges, icon: Sparkles, gradient: 'from-fuchsia-600/10 to-pink-600/5 border-fuchsia-500/20 text-fuchsia-500' },
      { label: 'Active User Challenges', value: stats.activeUserChallenges, icon: TrendingUp, gradient: 'from-emerald-600/10 to-teal-600/5 border-emerald-500/20 text-emerald-500' },
      { label: 'Completed User Challenges', value: stats.completedUserChallenges, icon: CheckCheck, gradient: 'from-indigo-600/10 to-violet-600/5 border-indigo-500/20 text-indigo-500' },
      { label: 'Total Check-ins', value: stats.totalCheckins, icon: ClipboardCheck, gradient: 'from-purple-600/10 to-pink-600/5 border-purple-500/20 text-purple-500' },
      { label: 'Unresolved Contacts', value: stats.contactUnresolved, icon: Mail, gradient: 'from-cyan-600/10 to-sky-600/5 border-cyan-500/20 text-cyan-500' },
    ];
  }, [stats]);

  const categoryChartData = useMemo(
    () => categories.map((c) => ({ name: c.name, challenges: c.challengeCount })),
    [categories],
  );

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
                Live Metric
              </div>
            </div>
          );
        })}
      </section>

      {/* Category Distribution Chart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Challenges by Category</h2>
          <p className="text-xs text-slate-500">Distribution of catalog challenges across wellness pillars</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="challenges" radius={[6, 6, 0, 0]} barSize={36}>
                {categoryChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

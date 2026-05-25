import { useState } from 'react';
import {
  Activity,
  Home,
  LogOut,
  Menu,
  Shield,
  FolderOpen,
  Trophy,
  Users,
  ClipboardCheck,
  Share2,
  X,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../routing/AuthProvider';

const navItems = [
  { label: 'Dashboard', to: '/', icon: Home },
  { label: 'Categories', to: '/categories', icon: FolderOpen },
  { label: 'Challenges', to: '/challenges', icon: Trophy },
  { label: 'Users', to: '/users', icon: Users },
  { label: 'Check-ins', to: '/checkins', icon: ClipboardCheck },
  { label: 'Share Events', to: '/share-events', icon: Share2 },
];

export function AdminLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop and Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10">
              <Activity size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight">Vital30</p>
              <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest">Admin Desk</p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 md:hidden"
            type="button"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  [
                    'flex h-11 items-center gap-3.5 rounded-xl px-4 text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-100'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent',
                  ].join(' ')
                }
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Signout */}
        <div className="border-t border-slate-200 p-4 bg-slate-50/50">
          <div className="flex items-center gap-3 px-2 pb-4">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 font-extrabold text-slate-600 text-sm border uppercase shadow-sm">
              {user?.name?.slice(0, 2) ?? 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate leading-tight">{user?.name}</p>
              <p className="text-3xs font-black text-emerald-600 uppercase tracking-wider mt-0.5">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-sm active:scale-95"
            type="button"
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Panel layout */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-xs md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
              type="button"
              aria-label="Open navigation"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <div className="hidden sm:block">
              <p className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest leading-none">Vital30 System</p>
              <p className="text-sm font-bold text-slate-950 mt-1">Management Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs">
            <Shield size={14} className="text-emerald-500" aria-hidden="true" />
            Secured Access
          </div>
        </header>

        <main className="flex-1 px-4 py-8 md:px-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldAlert, Loader } from 'lucide-react';
import { validateLoginForm } from '../validation/adminForms';
import { useAuth } from '../routing/AuthProvider';
import { adminLogin } from '../api/service';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);

    const result = validateLoginForm({ email, password });
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    try {
      setIsSubmitting(true);
      const data = await adminLogin(email, password);
      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      setAuthError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden text-slate-100 font-sans">
      {/* Background aesthetic blobs */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <section className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-8 shadow-2xl transition duration-300 hover:border-slate-700/60">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Activity size={24} className="animate-pulse" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Vital30 Admin Portal
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage challenges, categories, and users
          </p>
        </div>

        {authError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-950 bg-rose-950/30 p-3 text-sm text-rose-300">
            <ShieldAlert size={18} className="shrink-0 mt-0.5 text-rose-400" aria-hidden="true" />
            <p>{authError}</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              className="mb-1.5 block text-sm font-semibold text-slate-300"
              htmlFor="email"
            >
              Email Address
            </label>
            <input
              className={`h-11 w-full rounded-lg border bg-slate-950/60 px-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${
                errors.email ? 'border-rose-800/80 focus:border-rose-600 focus:ring-rose-500/10' : 'border-slate-800 focus:border-emerald-500'
              }`}
              id="email"
              name="email"
              placeholder="e.g. superadmin@vital30.com"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs font-semibold text-rose-400">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-semibold text-slate-300"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className={`h-11 w-full rounded-lg border bg-slate-950/60 px-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${
                errors.password ? 'border-rose-800/80 focus:border-rose-600 focus:ring-rose-500/10' : 'border-slate-800 focus:border-emerald-500'
              }`}
              id="password"
              name="password"
              placeholder="••••••••"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs font-semibold text-rose-400">
                {errors.password}
              </p>
            )}
          </div>

          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 font-semibold text-slate-950 transition hover:from-emerald-500 hover:to-teal-400 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader size={18} className="animate-spin text-slate-950" aria-hidden="true" />
            ) : (
              'Sign in to Admin'
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-center border-t border-slate-800/50 pt-5">
          <p className="text-xs text-slate-500">
            For local testing, use: <span className="font-mono text-emerald-400">superadmin@vital30.com</span>
            <br />
            with: <span className="font-mono text-emerald-400">Vital30AdminSecured!</span>
          </p>
        </div>
      </section>
    </main>
  );
}


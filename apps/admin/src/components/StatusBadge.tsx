
type BadgeType =
  | 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  | 'BEGINNER' | 'EASY' | 'MEDIUM' | 'HARD'
  | 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
  | 'MISSED' | 'SKIPPED'
  | 'CHALLENGE_INVITE' | 'DAILY_PROGRESS' | 'COMPLETION'
  | 'true' | 'false';

interface StatusBadgeProps {
  value: BadgeType | string;
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const normalized = value.toString().toUpperCase();

  const getStyles = (): { text: string; bg: string; border: string } => {
    switch (normalized) {
      // User Roles
      case 'SUPER_ADMIN':
        return { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' };
      case 'ADMIN':
        return { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' };
      case 'USER':
        return { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };

      // Difficulty
      case 'BEGINNER':
        return { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' };
      case 'EASY':
        return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'MEDIUM':
        return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'HARD':
        return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };

      // User Challenge Status
      case 'ACTIVE':
        return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'COMPLETED':
        return { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' };
      case 'ABANDONED':
        return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };

      // Checkin Status
      case 'MISSED':
        return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
      case 'SKIPPED':
        return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };

      // Share Event Type
      case 'CHALLENGE_INVITE':
        return { text: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' };
      case 'DAILY_PROGRESS':
        return { text: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' };
      case 'COMPLETION':
        return { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' };

      // Booleans
      case 'TRUE':
      case 'YES':
        return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' };
      case 'FALSE':
      case 'NO':
        return { text: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' };

      default:
        return { text: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' };
    }
  };

  const styles = getStyles();

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-all ${styles.bg} ${styles.text} ${styles.border}`}
    >
      {normalized.replace('_', ' ')}
    </span>
  );
}

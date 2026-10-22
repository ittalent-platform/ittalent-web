import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BroadcastStatus } from './broadcast-notifications.types';

export function BroadcastStatusBadge({
  status,
  className,
}: {
  status: BroadcastStatus;
  className?: string;
}) {
  switch (status) {
    case 'Draft':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            className,
          )}
        >
          <FileText className="size-3.5" />
          Draft
        </span>
      );
    case 'Scheduled':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
            className,
          )}
        >
          <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
          Scheduled
        </span>
      );
    case 'Sent':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
            className,
          )}
        >
          <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          Sent
        </span>
      );
    case 'Cancelled':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
            className,
          )}
        >
          <XCircle className="size-3.5 text-rose-600 dark:text-rose-400" />
          Cancelled
        </span>
      );
    default:
      return null;
  }
}

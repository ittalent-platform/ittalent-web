import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BroadcastPriority } from './broadcast-notifications.types';

export function BroadcastPriorityBadge({
  priority,
  className,
}: {
  priority: BroadcastPriority;
  className?: string;
}) {
  switch (priority) {
    case 'Low':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            className,
          )}
        >
          Low
        </span>
      );
    case 'Normal':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
            className,
          )}
        >
          Normal
        </span>
      );
    case 'High':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/40 dark:text-amber-300',
            className,
          )}
        >
          High
        </span>
      );
    case 'Urgent':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300',
            className,
          )}
        >
          <AlertCircle className="size-3 text-rose-600 dark:text-rose-400" />
          Urgent
        </span>
      );
    default:
      return null;
  }
}

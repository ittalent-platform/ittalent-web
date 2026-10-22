import {
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  MoreVertical,
  Pencil,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/common/empty-state';
import { BroadcastStatusBadge } from './broadcast-status-badge';
import { BroadcastPriorityBadge } from './broadcast-priority-badge';
import type { BroadcastNotificationDto } from './broadcast-notifications.types';

type BroadcastNotificationsTableProps = {
  items: BroadcastNotificationDto[];
  isLoading: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
  onViewDetails: (item: BroadcastNotificationDto) => void;
  onEdit: (item: BroadcastNotificationDto) => void;
  onSchedule: (item: BroadcastNotificationDto) => void;
  onCancelSchedule: (item: BroadcastNotificationDto) => void;
  onDispatchNow: (item: BroadcastNotificationDto) => void;
  onDelete: (item: BroadcastNotificationDto) => void;
};

function formatDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '—';
  }
}

export function BroadcastNotificationsTable({
  items,
  isLoading,
  hasFilters,
  onClearFilters,
  onViewDetails,
  onEdit,
  onSchedule,
  onCancelSchedule,
  onDispatchNow,
  onDelete,
}: BroadcastNotificationsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton className="h-12 w-full rounded-lg" key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    if (hasFilters) {
      return (
        <EmptyState
          action={{
            label: 'Clear Filters',
            onClick: onClearFilters,
          }}
          description="No broadcast announcements match your active filter criteria. Try adjusting keywords or statuses."
          title="No matching broadcasts found"
        />
      );
    }
    return (
      <EmptyState
        description="No broadcast notifications have been composed yet. Create your first announcement to notify users across the platform."
        title="No broadcast notifications yet"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHead>
          <TableHeaderRow className="bg-muted/30">
            <TableHeaderCell className="w-[320px] font-semibold">Title & Category</TableHeaderCell>
            <TableHeaderCell className="font-semibold">Target Audience</TableHeaderCell>
            <TableHeaderCell className="font-semibold">Priority</TableHeaderCell>
            <TableHeaderCell className="font-semibold">Status</TableHeaderCell>
            <TableHeaderCell className="font-semibold">Execution / Sent</TableHeaderCell>
            <TableHeaderCell className="w-[180px] font-semibold">Reach & Reads</TableHeaderCell>
            <TableHeaderCell className="w-[60px] text-right font-semibold">Actions</TableHeaderCell>
          </TableHeaderRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const isSent = item.status === 'Sent';
            const isScheduled = item.status === 'Scheduled';

            return (
              <TableRow
                className="cursor-pointer transition-colors hover:bg-muted/20"
                key={item.id}
                onClick={() => onViewDetails(item)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="line-clamp-1 font-semibold text-foreground hover:text-primary">
                      {item.title}
                    </span>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.2 text-[11px] font-medium">
                        {item.category}
                      </span>
                      {item.actionUrl && (
                        <span className="text-[11px] text-primary/80 hover:underline">
                          {item.actionLabel || 'Action Link'}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-foreground">{item.targetAudience}</span>
                </TableCell>

                <TableCell>
                  <BroadcastPriorityBadge priority={item.priority} />
                </TableCell>

                <TableCell>
                  <BroadcastStatusBadge status={item.status} />
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {isSent ? (
                    <div className="flex items-center gap-1.5 text-foreground">
                      <CheckCircle className="size-3.5 text-emerald-500" />
                      <span>{formatDate(item.sentAt)}</span>
                    </div>
                  ) : isScheduled ? (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Clock className="size-3.5" />
                      <span>{formatDate(item.scheduledAt)}</span>
                    </div>
                  ) : (
                    <span>Created: {formatDate(item.createdAt)}</span>
                  )}
                </TableCell>

                <TableCell>
                  {isSent ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {item.deliveryMetrics.readCount} / {item.deliveryMetrics.targetedCount} read
                        </span>
                        <span className="font-semibold text-foreground">
                          {item.deliveryMetrics.readPercentage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, item.deliveryMetrics.readPercentage)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      {isScheduled ? 'Pending execution' : 'Draft stage'}
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground">
                      <MoreVertical className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        className="cursor-pointer gap-2"
                        onClick={() => onViewDetails(item)}
                      >
                        <Eye className="size-4" />
                        View details
                      </DropdownMenuItem>

                      {!isSent && (
                        <DropdownMenuItem
                          className="cursor-pointer gap-2"
                          onClick={() => onEdit(item)}
                        >
                          <Pencil className="size-4" />
                          Edit content
                        </DropdownMenuItem>
                      )}

                      {!isSent && (
                        <DropdownMenuItem
                          className="cursor-pointer gap-2"
                          onClick={() => onSchedule(item)}
                        >
                          <Calendar className="size-4" />
                          {isScheduled ? 'Reschedule' : 'Schedule dispatch'}
                        </DropdownMenuItem>
                      )}

                      {!isSent && (
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 text-primary"
                          onClick={() => onDispatchNow(item)}
                        >
                          <Send className="size-4" />
                          Dispatch now
                        </DropdownMenuItem>
                      )}

                      {isScheduled && (
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 text-amber-600"
                          onClick={() => onCancelSchedule(item)}
                        >
                          <XCircle className="size-4" />
                          Cancel schedule
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

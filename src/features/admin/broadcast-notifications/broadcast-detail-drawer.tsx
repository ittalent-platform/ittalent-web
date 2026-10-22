import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Pencil,
  Send,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BroadcastStatusBadge } from './broadcast-status-badge';
import { BroadcastPriorityBadge } from './broadcast-priority-badge';
import { useBroadcastDetailQuery } from './broadcast-notifications.queries';
import type { BroadcastNotificationDto } from './broadcast-notifications.types';

type BroadcastDetailDrawerProps = {
  broadcast: BroadcastNotificationDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (broadcast: BroadcastNotificationDto) => void;
  onSchedule: (broadcast: BroadcastNotificationDto) => void;
  onCancelSchedule?: (broadcast: BroadcastNotificationDto) => void;
  onDispatchNow: (broadcast: BroadcastNotificationDto) => void;
  onDelete: (broadcast: BroadcastNotificationDto) => void;
};

function formatDetailDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  } catch {
    return '—';
  }
}

export function BroadcastDetailDrawer({
  broadcast,
  open,
  onOpenChange,
  onEdit,
  onSchedule,
  onDispatchNow,
  onDelete,
}: BroadcastDetailDrawerProps) {
  // Query fresh detail including live read receipts
  const detailQuery = useBroadcastDetailQuery(broadcast?.id);
  const data = detailQuery.data || broadcast;

  if (!data) return null;

  const isSent = data.status === 'Sent';
  const isScheduled = data.status === 'Scheduled';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {data.category}
            </span>
            <BroadcastStatusBadge status={data.status} />
            <BroadcastPriorityBadge priority={data.priority} />
          </div>
          <DialogTitle className="mt-2 text-xl font-bold text-foreground">
            {data.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Section 1: Message Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Message Content & Preview
            </h4>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {data.content}
              </p>

              {data.actionUrl && (
                <div className="mt-4 pt-3 border-t border-border">
                  <a
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition"
                    href={data.actionUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span>{data.actionLabel || 'Visit Action Link'}</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Distribution Metadata */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Distribution & Sender Metadata
            </h4>
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4 shrink-0 text-primary" />
                <span>
                  Target Audience: <strong className="text-foreground">{data.targetAudience}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="size-4 shrink-0 text-primary" />
                <span>
                  Created By:{' '}
                  <strong className="text-foreground">
                    {data.sender?.fullName || data.sender?.email || 'System Administrator'}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <span>
                  Created At: <strong className="text-foreground">{formatDetailDate(data.createdAt)}</strong>
                </span>
              </div>

              {isSent && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="size-4 shrink-0" />
                  <span>
                    Dispatched At:{' '}
                    <strong className="text-foreground">{formatDetailDate(data.sentAt)}</strong>
                  </span>
                </div>
              )}

              {isScheduled && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Calendar className="size-4 shrink-0" />
                  <span>
                    Scheduled At:{' '}
                    <strong className="text-foreground">{formatDetailDate(data.scheduledAt)}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Delivery Analytics */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Delivery & Engagement Analytics
            </h4>

            {isSent ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-2 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Targeted</p>
                    <p className="text-lg font-bold text-foreground">
                      {data.deliveryMetrics.targetedCount}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Delivered</p>
                    <p className="text-lg font-bold text-foreground">
                      {data.deliveryMetrics.deliveredCount}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Read / Opened</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {data.deliveryMetrics.readCount} ({data.deliveryMetrics.readPercentage}%)
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Recipient Read Engagement</span>
                    <span className="font-semibold text-foreground">
                      {data.deliveryMetrics.readPercentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, data.deliveryMetrics.readPercentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                <Clock className="mx-auto size-6 mb-1 text-muted-foreground/60" />
                <p className="font-medium text-foreground">Pending Dispatch</p>
                <p className="mt-0.5">
                  Real-time delivery and read analytics will automatically generate once this announcement is dispatched.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            className="text-destructive hover:bg-destructive/10"
            onClick={() => {
              onOpenChange(false);
              onDelete(data);
            }}
            size="sm"
            variant="ghost"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {!isSent && (
              <Button
                className="gap-1.5"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(data);
                }}
                size="sm"
                variant="outline"
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            )}

            {!isSent && (
              <Button
                className="gap-1.5"
                onClick={() => {
                  onOpenChange(false);
                  onSchedule(data);
                }}
                size="sm"
                variant="outline"
              >
                <Calendar className="size-3.5" />
                {isScheduled ? 'Reschedule' : 'Schedule'}
              </Button>
            )}

            {!isSent && (
              <Button
                className="gap-1.5"
                onClick={() => {
                  onOpenChange(false);
                  onDispatchNow(data);
                }}
                size="sm"
              >
                <Send className="size-3.5" />
                Dispatch Now
              </Button>
            )}

            <Button onClick={() => onOpenChange(false)} size="sm" variant="secondary">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

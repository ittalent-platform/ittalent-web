import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Pencil,
  Radio,
  Send,
  Sparkles,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
      <DialogContent className="w-full max-w-[720px] gap-0 overflow-hidden rounded-2xl p-0 border border-border/80 shadow-2xl flex flex-col max-h-[92vh]">
        <DialogHeader className="shrink-0 bg-muted/15 border-b border-border/60 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground shadow-xs">
              <Sparkles className="size-3 text-primary/70" />
              {data.category}
            </span>
            <BroadcastStatusBadge status={data.status} />
            <BroadcastPriorityBadge priority={data.priority} />
          </div>
          <DialogTitle className="mt-2 text-xl font-bold tracking-tight text-foreground leading-snug">
            {data.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Section 1: Message Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground/90">
                Message Content & Preview
              </span>
              {data.channels && data.channels.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Radio className="size-3 text-primary" />
                  <span>Channels: {data.channels.join(', ')}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 transition-colors">
              <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/90 font-normal select-text">
                {data.content}
              </p>

              {data.actionUrl && (
                <div className="mt-3.5 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
                  <a
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                    href={data.actionUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span>{data.actionLabel || 'Visit Action Link'}</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                  <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[280px]">
                    {data.actionUrl}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Distribution Metadata */}
          <div className="space-y-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground/90">
              Distribution & Sender
            </span>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-3.5 py-2.5 shadow-2xs">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Users className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-medium text-muted-foreground">Target Audience</p>
                  <p className="truncate text-xs font-semibold text-foreground">{data.targetAudience}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-3.5 py-2.5 shadow-2xs">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <User className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-medium text-muted-foreground">Created By</p>
                  <p className="truncate text-xs font-semibold text-foreground">
                    {data.sender?.fullName || data.sender?.email || 'System Administrator'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-3.5 py-2.5 shadow-2xs">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Clock className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-medium text-muted-foreground">Created At</p>
                  <p className="truncate text-xs font-semibold text-foreground">{formatDetailDate(data.createdAt)}</p>
                </div>
              </div>

              {isSent ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 shadow-2xs">
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-medium text-emerald-700 dark:text-emerald-300">Dispatched At</p>
                    <p className="truncate text-xs font-semibold text-foreground">{formatDetailDate(data.sentAt)}</p>
                  </div>
                </div>
              ) : isScheduled ? (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5 shadow-2xs">
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Calendar className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-medium text-amber-700 dark:text-amber-300">Scheduled At</p>
                    <p className="truncate text-xs font-semibold text-foreground">{formatDetailDate(data.scheduledAt)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-3.5 py-2.5 shadow-2xs">
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Mail className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-medium text-muted-foreground">Status</p>
                    <p className="truncate text-xs font-semibold text-foreground">Draft (Pending Dispatch)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Delivery Analytics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground/90">
                Delivery & Engagement Analytics
              </span>
              {isSent && (
                <span className="text-[11px] text-muted-foreground">
                  Live telemetry synced
                </span>
              )}
            </div>

            {isSent ? (
              <div className="rounded-xl border border-border/70 bg-card px-4 py-3.5 shadow-xs space-y-3">
                <div className="grid grid-cols-3 divide-x divide-border/60">
                  <div className="px-2 sm:px-4 text-center first:pl-0">
                    <p className="text-[10.5px] font-medium text-muted-foreground">Targeted</p>
                    <p className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
                      {data.deliveryMetrics.targetedCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Recipients</p>
                  </div>

                  <div className="px-2 sm:px-4 text-center">
                    <p className="text-[10.5px] font-medium text-muted-foreground">Delivered</p>
                    <p className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
                      {data.deliveryMetrics.deliveredCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Inboxes reached</p>
                  </div>

                  <div className="px-2 sm:px-4 text-center last:pr-0">
                    <p className="text-[10.5px] font-medium text-muted-foreground">Read / Opened</p>
                    <p className="mt-0.5 text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                      {data.deliveryMetrics.readCount}{' '}
                      <span className="text-xs font-semibold text-emerald-600/80">
                        ({data.deliveryMetrics.readPercentage}%)
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">Receipts confirmed</p>
                  </div>
                </div>

                <div className="space-y-1 pt-2.5 border-t border-border/50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[11px] text-muted-foreground font-medium">Recipient Read Engagement</span>
                    <span className="text-xs font-semibold text-foreground">
                      {data.deliveryMetrics.readPercentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, data.deliveryMetrics.readPercentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-center">
                <Clock className="mx-auto size-5 text-muted-foreground/60 mb-1.5" />
                <p className="text-xs font-semibold text-foreground">Pending Dispatch</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm mx-auto">
                  Real-time delivery counts and recipient open rates will automatically track once this broadcast is dispatched.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Actions Footer */}
        <DialogFooter className="shrink-0 border-t border-border/60 bg-muted/20 px-6 py-3.5 flex flex-row items-center justify-between sm:justify-between w-full">
          <Button
            className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 px-3"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

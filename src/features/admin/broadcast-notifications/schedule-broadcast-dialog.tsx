import { useMemo, useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { BroadcastNotificationDto } from './broadcast-notifications.types';
import { useScheduleBroadcastMutation } from './broadcast-notifications.queries';

type ScheduleBroadcastDialogProps = {
  broadcast: BroadcastNotificationDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ScheduleBroadcastDialogContent({
  broadcast,
  onOpenChange,
}: {
  broadcast: BroadcastNotificationDto;
  onOpenChange: (open: boolean) => void;
}) {
  const [defaultDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });

  const [dateStr, setDateStr] = useState(() => {
    if (broadcast.scheduledAt) {
      return new Date(broadcast.scheduledAt).toISOString().split('T')[0];
    }
    return defaultDate;
  });

  const [timeStr, setTimeStr] = useState(() => {
    if (broadcast.scheduledAt) {
      return new Date(broadcast.scheduledAt).toTimeString().slice(0, 5);
    }
    return '09:00';
  });

  const [now, setNow] = useState(() => Date.now());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scheduleMutation = useScheduleBroadcastMutation();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const targetTimestamp = useMemo(() => {
    if (!dateStr || !timeStr) return null;
    const combined = new Date(`${dateStr}T${timeStr}:00`);
    return isNaN(combined.getTime()) ? null : combined;
  }, [dateStr, timeStr]);

  const countdownText = useMemo(() => {
    if (!targetTimestamp) return null;
    const diffMs = targetTimestamp.getTime() - now;
    if (diffMs < 15 * 60 * 1000) {
      return {
        valid: false,
        text: 'Selected time must be at least 15 minutes ahead of current time.',
      };
    }

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

    return {
      valid: true,
      text: `Execution scheduled in ${parts.join(', ')}`,
    };
  }, [targetTimestamp, now]);

  async function handleConfirm() {
    if (!targetTimestamp) {
      setErrorMsg('Please select a valid future date and time.');
      return;
    }

    if (countdownText && !countdownText.valid) {
      setErrorMsg(countdownText.text);
      return;
    }

    try {
      await scheduleMutation.mutateAsync({
        id: broadcast.id,
        payload: {
          scheduled_at: targetTimestamp.toISOString(),
        },
      });

      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to schedule broadcast.';
      setErrorMsg(message);
    }
  }

  return (
    <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0 border border-border/80 shadow-2xl">
      <DialogHeader className="bg-muted/15 border-b border-border/60 px-6 py-5">
        <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Calendar className="size-5 text-primary" />
          Schedule Broadcast Dispatch
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-1">
          Configure this announcement to be automatically published and distributed to target audiences at a future timestamp.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[calc(88vh-160px)] overflow-y-auto px-6 py-5 space-y-4">
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Announcement</p>
          <p className="font-semibold text-foreground line-clamp-1">{broadcast.title}</p>
          <p className="text-xs text-muted-foreground">Target: {broadcast.targetAudience} • Priority: {broadcast.priority}</p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="schedule-date">Execution Date</Label>
            <Input
              id="schedule-date"
              onChange={(e) => {
                setDateStr(e.target.value);
                setErrorMsg(null);
              }}
              type="date"
              value={dateStr}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schedule-time">Execution Time</Label>
            <Input
              id="schedule-time"
              onChange={(e) => {
                setTimeStr(e.target.value);
                setErrorMsg(null);
              }}
              type="time"
              value={timeStr}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Target Timezone</Label>
          <Input disabled value="Asia/Ho_Chi_Minh (GMT+7:00)" />
        </div>

        {countdownText && (
          <div
            className={`flex items-center gap-2 rounded-lg border p-3 text-xs ${
              countdownText.valid
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            <Clock className="size-4 shrink-0" />
            <span className="font-medium">{countdownText.text}</span>
          </div>
        )}

        <div className="rounded-lg bg-blue-50/60 p-3 text-xs text-blue-900 border border-blue-200/50 dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-blue-300">
          Scheduled broadcasts can be modified or reverted up until 5 minutes before scheduled execution.
        </div>
      </div>

      <DialogFooter className="border-t border-border/60 bg-muted/20 px-6 py-4 flex gap-2 sm:justify-end">
        <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
          Cancel
        </Button>
        <Button
          className="gap-1.5"
          disabled={scheduleMutation.isPending || (countdownText !== null && !countdownText.valid)}
          onClick={handleConfirm}
          type="button"
        >
          <Clock className="size-4" />
          {scheduleMutation.isPending ? 'Scheduling...' : 'Confirm Schedule'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function ScheduleBroadcastDialog({
  broadcast,
  open,
  onOpenChange,
}: ScheduleBroadcastDialogProps) {
  if (!broadcast) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ScheduleBroadcastDialogContent
        key={broadcast.id}
        broadcast={broadcast}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  );
}

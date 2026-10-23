import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Clock } from "lucide-react";

import { DIALOG_BUTTON_CLASS } from "@/components/common/action-confirm-dialog";
import { FormField } from "@/components/common/form-field";
import { InlineErrorAlert } from "@/components/common/inline-error-alert";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatTimeIct, ictDayKey } from "@/lib/format";

import { MIN_SCHEDULE_ADVANCE_MS } from "./broadcast-notifications.constants";
import { useScheduleBroadcastMutation } from "./broadcast-notifications.queries";
import type { BroadcastNotificationDto } from "./broadcast-notifications.types";

type ScheduleBroadcastDialogProps = {
  broadcast: BroadcastNotificationDto | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function computeDefaultDate(scheduledAt?: string | null): string {
  if (scheduledAt) {
    return ictDayKey(scheduledAt);
  }
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return ictDayKey(tomorrow);
}

function computeDefaultTime(scheduledAt?: string | null): string {
  if (scheduledAt) {
    return formatTimeIct(scheduledAt);
  }
  return "09:00";
}

function ScheduleBroadcastDialogContent({
  broadcast,
  onOpenChange,
  open,
}: {
  broadcast: BroadcastNotificationDto;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const scheduleMutation = useScheduleBroadcastMutation();

  const [dateStr, setDateStr] = useState(() => computeDefaultDate(broadcast.scheduledAt));
  const [timeStr, setTimeStr] = useState(() => computeDefaultTime(broadcast.scheduledAt));
  const [now, setNow] = useState(() => Date.now());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const minSelectableDate = ictDayKey(new Date(now));

  const targetDateIct = useMemo(() => {
    if (!dateStr || !timeStr) return null;
    const parsed = new Date(`${dateStr}T${timeStr}:00+07:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [dateStr, timeStr]);

  const countdown = useMemo(() => {
    if (!targetDateIct) return null;
    const diffMs = targetDateIct.getTime() - now;
    if (diffMs < MIN_SCHEDULE_ADVANCE_MS) {
      return {
        text: t("adminBroadcasts.schedule.advanceNotice"),
        valid: false,
      };
    }
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    let parts = "";
    if (days > 0) parts += `${days}d `;
    if (hours > 0 || days > 0) parts += `${hours}h `;
    parts += `${minutes}m`;

    return {
      text: t("adminBroadcasts.schedule.dispatchesIn", { time: parts.trim() }),
      valid: true,
    };
  }, [targetDateIct, now, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const checkNow = Date.now();
    if (!targetDateIct || targetDateIct.getTime() - checkNow < MIN_SCHEDULE_ADVANCE_MS) {
      setErrorMsg(t("adminBroadcasts.schedule.advanceNotice"));
      return;
    }

    try {
      await scheduleMutation.mutateAsync({
        id: broadcast.id,
        scheduled_at: targetDateIct.toISOString(),
      });

      showToast({
        message: t("adminBroadcasts.toast.scheduledMessage", {
          title: broadcast.title,
        }),
        title: t("adminBroadcasts.toast.scheduledTitle"),
        tone: "success",
      });

      onOpenChange(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : t("state.error", { defaultValue: "Failed to schedule broadcast" }),
      );
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("adminBroadcasts.dialog.scheduleTitle")}</DialogTitle>
          <DialogDescription>
            {t("adminBroadcasts.dialog.scheduleDescription", {
              title: broadcast.title,
            })}
          </DialogDescription>
        </DialogHeader>

        {errorMsg ? (
          <div className="py-1">
            <InlineErrorAlert>{errorMsg}</InlineErrorAlert>
          </div>
        ) : null}

        <form className="flex flex-col gap-4 py-2" id="schedule-broadcast-form" onSubmit={handleSubmit}>
          <FormField
            htmlFor="schedule-date"
            label={t("adminBroadcasts.schedule.dateLabel")}
            required
          >
            <DatePicker
              clearable={false}
              id="schedule-date"
              min={minSelectableDate}
              onChange={(val) => {
                setDateStr(val);
                setNow(Date.now());
              }}
              value={dateStr}
            />
          </FormField>

          <FormField
            hint={t("adminBroadcasts.schedule.timezoneHint")}
            htmlFor="schedule-time"
            label={t("adminBroadcasts.schedule.timeLabel")}
            required
          >
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                id="schedule-time"
                onChange={(e) => {
                  setTimeStr(e.target.value);
                  setNow(Date.now());
                }}
                type="time"
                value={timeStr}
              />
            </div>
          </FormField>

          {countdown ? (
            <div
              className={`rounded-lg p-3 text-xs ${
                countdown.valid
                  ? "bg-(--status-info-bg) text-(--status-info-fg)"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {countdown.text}
            </div>
          ) : null}
        </form>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <Button
            className={DIALOG_BUTTON_CLASS}
            disabled={scheduleMutation.isPending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {t("actions.cancel")}
          </Button>

          <Button
            className={DIALOG_BUTTON_CLASS}
            disabled={scheduleMutation.isPending || (countdown !== null && !countdown.valid)}
            form="schedule-broadcast-form"
            type="submit"
          >
            <Calendar className="size-4" />
            {t("adminBroadcasts.actions.confirmSchedule")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ScheduleBroadcastDialog({
  broadcast,
  onOpenChange,
  open,
}: ScheduleBroadcastDialogProps) {
  if (!broadcast) return null;
  return (
    <ScheduleBroadcastDialogContent
      broadcast={broadcast}
      key={broadcast.id}
      onOpenChange={onOpenChange}
      open={open}
    />
  );
}

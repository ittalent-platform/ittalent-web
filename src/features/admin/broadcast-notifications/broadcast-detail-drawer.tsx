import {
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Pencil,
  Radio,
  Send,
  Sparkles,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { DIALOG_BUTTON_CLASS } from "@/components/common/action-confirm-dialog";
import { KeyValueBox } from "@/components/common/key-value-box";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTimeIct } from "@/lib/format";

import { useBroadcastDetailQuery } from "./broadcast-notifications.queries";
import { isSafeHttpUrl } from "./broadcast-notifications.schemas";
import type { BroadcastNotificationDto } from "./broadcast-notifications.types";
import { BroadcastPriorityBadge } from "./broadcast-priority-badge";
import { BroadcastStatusBadge } from "./broadcast-status-badge";

type BroadcastDetailDialogProps = {
  broadcast: BroadcastNotificationDto | null;
  onCancelSchedule?: (broadcast: BroadcastNotificationDto) => void;
  onDelete: (broadcast: BroadcastNotificationDto) => void;
  onDispatchNow: (broadcast: BroadcastNotificationDto) => void;
  onEdit: (broadcast: BroadcastNotificationDto) => void;
  onOpenChange: (open: boolean) => void;
  onSchedule: (broadcast: BroadcastNotificationDto) => void;
  open: boolean;
};

export function BroadcastDetailDialog({
  broadcast,
  onCancelSchedule,
  onDelete,
  onDispatchNow,
  onEdit,
  onOpenChange,
  onSchedule,
  open,
}: BroadcastDetailDialogProps) {
  const { t } = useTranslation();
  // Fetch latest delivery statistics and state
  const detailQuery = useBroadcastDetailQuery(broadcast?.id);
  const data = detailQuery.data || broadcast;

  if (!data) return null;

  const isSent = data.status === "Sent";
  const isScheduled = data.status === "Scheduled";
  const isDraft = data.status === "Draft";
  const hasSafeActionUrl = isSafeHttpUrl(data.actionUrl);

  const distributionRows = [
    {
      label: t("adminBroadcasts.detail.targetAudience"),
      value: (
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <Users className="size-3.5 text-muted-foreground" />
          {t(`adminBroadcasts.audience.${data.targetAudience}`, {
            defaultValue: data.targetAudience,
          })}
        </span>
      ),
    },
    {
      label: t("adminBroadcasts.detail.createdBy"),
      value: (
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <User className="size-3.5 text-muted-foreground" />
          {data.sender?.fullName || data.sender?.email || t("adminBroadcasts.detail.systemAdmin")}
        </span>
      ),
    },
    {
      label: t("adminBroadcasts.detail.createdAt"),
      value: (
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <Clock className="size-3.5 text-muted-foreground" />
          {formatDateTimeIct(data.createdAt)}
        </span>
      ),
    },
    ...(isSent
      ? [
          {
            label: t("adminBroadcasts.detail.sentAt"),
            value: (
              <span className="inline-flex items-center gap-1.5 text-(--status-success-fg)">
                <CheckCircle2 className="size-3.5" />
                {formatDateTimeIct(data.sentAt ?? undefined)}
              </span>
            ),
          },
        ]
      : []),
    ...(isScheduled
      ? [
          {
            label: t("adminBroadcasts.detail.scheduledFor"),
            value: (
              <span className="inline-flex items-center gap-1.5 text-(--status-warning-fg)">
                <Calendar className="size-3.5" />
                {formatDateTimeIct(data.scheduledAt ?? undefined)}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3 text-primary/70" />
              {t(`adminBroadcasts.category.${data.category}`, {
                defaultValue: data.category,
              })}
            </span>
            <BroadcastStatusBadge status={data.status} />
            <BroadcastPriorityBadge priority={data.priority} />
          </div>
          <DialogTitle className="mt-2 text-lg font-bold leading-snug text-foreground">
            {data.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {/* Section 1: Message Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>{t("adminBroadcasts.detail.messageContent")}</span>
              {data.channels && data.channels.length > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Radio className="size-3.5 text-primary" />
                  <span>
                    {data.channels
                      .map((c) =>
                        t(`adminBroadcasts.channel.${c === "In-App Inbox" ? "inApp" : "emailDigest"}`, {
                          defaultValue: c,
                        }),
                      )
                      .join(", ")}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap select-text text-sm leading-relaxed text-foreground">
                {data.content}
              </p>

              {data.actionUrl ? (
                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  {hasSafeActionUrl ? (
                    <a
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      href={data.actionUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span>{data.actionLabel || t("adminBroadcasts.detail.visitLink")}</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-destructive">
                      {t("adminBroadcasts.detail.unsafeUrlBlocked")}
                    </span>
                  )}
                  <span className="max-w-[280px] truncate font-mono text-xs text-muted-foreground">
                    {data.actionUrl}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Section 2: Distribution Details */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("adminBroadcasts.detail.distributionDetails")}
            </span>
            <KeyValueBox rows={distributionRows} />
          </div>

          {/* Section 3: Delivery Analytics */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("adminBroadcasts.detail.analyticsTitle")}
            </span>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">{t("adminBroadcasts.detail.targeted")}</p>
                <p className="text-lg font-bold text-foreground">
                  {data.deliveryMetrics.targetedCount.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">{t("adminBroadcasts.detail.delivered")}</p>
                <p className="text-lg font-bold text-foreground">
                  {data.deliveryMetrics.deliveredCount.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">{t("adminBroadcasts.detail.readReceipts")}</p>
                <p className="text-lg font-bold text-foreground">
                  {data.deliveryMetrics.readCount.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">{t("adminBroadcasts.detail.openRate")}</p>
                <p className="text-lg font-bold text-foreground">
                  {data.deliveryMetrics.readPercentage}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/20 px-6 py-3.5">
          <Button
            className={DIALOG_BUTTON_CLASS}
            onClick={() => {
              onOpenChange(false);
              onDelete(data);
            }}
            type="button"
            variant="ghost"
          >
            {data.status === "Sent" ? (
              <>
                <Archive className="size-4 text-destructive" />
                <span className="text-destructive">{t("adminBroadcasts.actions.archive")}</span>
              </>
            ) : (
              <>
                <Trash2 className="size-4 text-destructive" />
                <span className="text-destructive">{t("actions.delete")}</span>
              </>
            )}
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {isDraft ? (
              <>
                <Button
                  className={DIALOG_BUTTON_CLASS}
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(data);
                  }}
                  type="button"
                  variant="outline"
                >
                  <Pencil className="size-4" />
                  {t("actions.edit")}
                </Button>
                <Button
                  className={DIALOG_BUTTON_CLASS}
                  onClick={() => {
                    onOpenChange(false);
                    onSchedule(data);
                  }}
                  type="button"
                  variant="secondary"
                >
                  <Calendar className="size-4" />
                  {t("adminBroadcasts.actions.schedule")}
                </Button>
                <Button
                  className={DIALOG_BUTTON_CLASS}
                  onClick={() => {
                    onOpenChange(false);
                    onDispatchNow(data);
                  }}
                  type="button"
                >
                  <Send className="size-4" />
                  {t("adminBroadcasts.actions.dispatchNow")}
                </Button>
              </>
            ) : null}

            {isScheduled ? (
              <>
                <Button
                  className={DIALOG_BUTTON_CLASS}
                  onClick={() => {
                    onOpenChange(false);
                    onSchedule(data);
                  }}
                  type="button"
                  variant="outline"
                >
                  <Calendar className="size-4" />
                  {t("adminBroadcasts.actions.reschedule")}
                </Button>
                <Button
                  className={DIALOG_BUTTON_CLASS}
                  onClick={() => {
                    onOpenChange(false);
                    onCancelSchedule?.(data);
                  }}
                  type="button"
                  variant="destructive"
                >
                  <XCircle className="size-4" />
                  {t("adminBroadcasts.actions.cancelSchedule")}
                </Button>
                <Button
                  className={DIALOG_BUTTON_CLASS}
                  onClick={() => {
                    onOpenChange(false);
                    onDispatchNow(data);
                  }}
                  type="button"
                >
                  <Send className="size-4" />
                  {t("adminBroadcasts.actions.dispatchNow")}
                </Button>
              </>
            ) : null}

            <Button
              className={DIALOG_BUTTON_CLASS}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              {t("actions.close")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Export alias for backwards compatibility */
export const BroadcastDetailDrawer = BroadcastDetailDialog;

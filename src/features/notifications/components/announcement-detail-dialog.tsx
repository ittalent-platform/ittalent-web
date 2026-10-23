import { Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NotificationItem } from "@/features/notifications/types";
import { formatAnnouncementDateTime } from "@/features/notifications/notifications.format";

export interface AnnouncementDetailDialogProps {
  item: NotificationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
}

/**
 * Announcement detail dialog displaying full broadcast message,
 * read-only metadata, security-sandboxed content, and user-level deletion.
 * Matches Figma specification (PersonalNotification.html board 1273df06).
 */
export function AnnouncementDetailDialog({
  item,
  open,
  onOpenChange,
  onDelete,
}: AnnouncementDetailDialogProps) {
  const { t, i18n } = useTranslation();

  if (!item) return null;

  const formattedDate = formatAnnouncementDateTime(item.createdAt, i18n.language);

  const handleDelete = () => {
    if (item.id && onDelete) {
      onDelete(item.id);
    }
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        aria-label={t("notifications.announcement.dialogTitle", { defaultValue: "Announcement" })}
        className="max-w-[560px] gap-0 overflow-hidden rounded-[16px] p-0 bg-card border border-border shadow-2xl"
      >
        {/* Header with megaphone badge and metadata */}
        <div className="flex items-start gap-3.5 p-6 pb-0 pr-12">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-ember-wash text-fg-link"
          >
            <Megaphone className="size-5" />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wider text-fg-link uppercase">
              {t("notifications.announcement.badge", { defaultValue: "ANNOUNCEMENT · ITTALENT" })}
            </span>
            <DialogTitle className="font-['Space_Grotesk'] text-[20px] font-semibold leading-tight text-foreground">
              {item.title}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              {formattedDate}
            </DialogDescription>
          </div>
        </div>

        {/* Full message body */}
        <div className="px-6 py-4.5 text-[14.5px] leading-[1.7] text-foreground whitespace-pre-wrap">
          {item.message}
        </div>

        {/* Footer with broadcast note and action buttons */}
        <div className="flex items-center gap-2.5 px-6 pb-6 pt-3">
          <span className="flex-1 text-[12.5px] text-muted-foreground">
            {t("notifications.announcement.replyNote", {
              defaultValue: "Sent to everyone in a group. Replies aren’t possible.",
            })}
          </span>
          {onDelete && item.id && (
            <Button
              className="font-semibold"
              onClick={handleDelete}
              type="button"
              variant="outline"
            >
              {t("common.delete", { defaultValue: "Delete" })}
            </Button>
          )}
          <Button
            className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            {t("common.close", { defaultValue: "Close" })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

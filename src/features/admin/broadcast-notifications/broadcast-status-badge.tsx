import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import type { BroadcastStatus } from "./broadcast-notifications.types";

const STATUS_VARIANT: Record<BroadcastStatus, "neutral" | "warning" | "success" | "destructive"> = {
  Cancelled: "destructive",
  Draft: "neutral",
  Scheduled: "warning",
  Sent: "success",
};

export function BroadcastStatusBadge({
  className,
  status,
}: {
  className?: string;
  status: BroadcastStatus;
}) {
  const { t } = useTranslation();
  const variant = STATUS_VARIANT[status] ?? "neutral";
  return (
    <Badge className={className} variant={variant}>
      {t(`adminBroadcasts.status.${status}`, { defaultValue: status })}
    </Badge>
  );
}

import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import type { BroadcastPriority } from "./broadcast-notifications.types";

const PRIORITY_VARIANT: Record<BroadcastPriority, "neutral" | "info" | "warning" | "destructive"> = {
  High: "warning",
  Low: "neutral",
  Normal: "info",
  Urgent: "destructive",
};

export function BroadcastPriorityBadge({
  className,
  priority,
}: {
  className?: string;
  priority: BroadcastPriority;
}) {
  const { t } = useTranslation();
  const variant = PRIORITY_VARIANT[priority] ?? "neutral";
  return (
    <Badge className={className} variant={variant}>
      {t(`adminBroadcasts.priority.${priority}`, { defaultValue: priority })}
    </Badge>
  );
}

import { MapPin, Video } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { MODE_BADGE_VARIANT, STATUS_BADGE_VARIANT, type InterviewMode, type InterviewStatus } from "./interviews.constants";

export function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  const { t } = useTranslation();
  return <Badge variant={STATUS_BADGE_VARIANT[status]}>{t(`interviews.status.${status}`)}</Badge>;
}

export function InterviewModeBadge({ mode }: { mode: InterviewMode }) {
  const { t } = useTranslation();
  const Icon = mode === "online" ? Video : MapPin;
  return (
    <Badge variant={MODE_BADGE_VARIANT[mode]}>
      <Icon aria-hidden className="size-3" />
      {t(`interviews.mode.${mode}`)}
    </Badge>
  );
}

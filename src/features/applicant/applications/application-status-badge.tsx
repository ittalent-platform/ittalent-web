import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { STATUS_TONES, type ApplicationStatus } from "./applications.constants";

/** Status is always a word inside a tint pair, never colour alone. */
export function ApplicationStatusBadge({ className, size = "sm", status }: { className?: string; size?: "md" | "sm"; status: ApplicationStatus }) {
  const { t } = useTranslation();
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full font-semibold", size === "sm" ? "h-6 px-2.5 text-xs" : "h-7 px-3 text-[12.5px]", STATUS_TONES[status].badge, className)}>
      {t(`applications.status.${status}`)}
    </span>
  );
}

import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { JobPosting } from "@/api/generated/types.gen";

/**
 * Renders the job status pill. In auto mode, published jobs reflect their
 * recruitment status (Open / Closed) while Draft and Archived keep their publication badge.
 * In publication mode, it always renders the publication status.
 */
export function JobPostingStatusBadge({
  posting,
  mode = "auto",
  className,
}: {
  posting: Pick<JobPosting, "status" | "recruitmentStatus">;
  mode?: "publication" | "recruitment" | "auto";
  className?: string;
}) {
  const { t } = useTranslation();

  if (mode === "publication") {
    const variantMap: Record<string, "success" | "neutral" | "warning"> = {
      published: "success",
      draft: "neutral",
      closed: "warning",
      archived: "neutral",
    };
    return (
      <Badge
        variant={variantMap[posting.status] ?? "neutral"}
        className={cn("h-6 px-2.5 text-[12px] font-semibold", className)}
      >
        {t(`jobPostings.publicationStatus.${posting.status}`)}
      </Badge>
    );
  }

  if (posting.status !== "published") {
    return (
      <Badge
        variant="neutral"
        className={cn("h-6 px-2.5 text-[12px] font-semibold", className)}
      >
        {t(`jobPostings.publicationStatus.${posting.status}`)}
      </Badge>
    );
  }

  return (
    <Badge
      variant={posting.recruitmentStatus === "open" ? "success" : "neutral"}
      className={cn("h-6 px-2.5 text-[12px] font-semibold", className)}
    >
      {t(`jobPostings.recruitmentStatus.${posting.recruitmentStatus}`)}
    </Badge>
  );
}

import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import type { JobPosting } from "@/api/generated/types.gen";

/**
 * Sprint 1 only ever saves Published jobs, so the tag shows the recruitment status (Open until the
 * deadline passes, then Closed). Legacy Draft / Archived records keep their own label.
 */
export function JobPostingStatusBadge({ posting }: { posting: Pick<JobPosting, "status" | "recruitmentStatus"> }) {
  const { t } = useTranslation();
  if (posting.status !== "published") {
    return <Badge variant="neutral">{t(`jobPostings.publicationStatus.${posting.status}`)}</Badge>;
  }
  return (
    <Badge variant={posting.recruitmentStatus === "open" ? "success" : "neutral"}>
      {t(`jobPostings.recruitmentStatus.${posting.recruitmentStatus}`)}
    </Badge>
  );
}

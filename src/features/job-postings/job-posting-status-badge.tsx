import { Badge } from "@/components/ui/badge";

import type { JobPosting } from "@/api/generated/types.gen";

export function JobPostingStatusBadge({ status }: { status: JobPosting["status"] }) {
  const styles = {
    archived: "bg-muted text-muted-foreground",
    draft: "bg-(--status-warning-bg) text-(--status-warning-fg)",
    published: "bg-(--status-success-bg) text-(--status-success-fg)",
  };

  return <Badge className={styles[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

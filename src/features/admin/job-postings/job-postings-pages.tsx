import { JobPostingDetailPage as SharedJobPostingDetailPage } from "@/features/job-postings/job-posting-detail-page";
import { JobPostingListPage } from "@/features/job-postings/job-posting-list-page";

export function JobPostingDetailPage() {
  return <SharedJobPostingDetailPage actor="admin" />;
}

export function JobPostingsPage() {
  return <JobPostingListPage actor="admin" />;
}

import {
  JobPostingDetailPage as SharedJobPostingDetailPage,
  JobPostingListPage,
} from "@/features/job-postings/job-posting-management-pages";

export function JobPostingDetailPage() {
  return <SharedJobPostingDetailPage actor="admin" />;
}

export function JobPostingsPage() {
  return <JobPostingListPage actor="admin" />;
}
